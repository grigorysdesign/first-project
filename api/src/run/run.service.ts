import fetch from "cross-fetch";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuid } from "uuid";

import { DatabaseService } from "../common/database.service";
import { LogsGateway } from "../ws/logs.gateway";

@Injectable()
export class RunService {
  private readonly logger = new Logger(RunService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly database: DatabaseService,
    private readonly logsGateway: LogsGateway
  ) {}

  private get runnerUrl() {
    return this.configService.get<string>("runnerUrl") ?? "http://localhost:4000";
  }

  async createRun(projectId: string, stack: string) {
    const runId = uuid();
    await this.database.query(
      "INSERT INTO runs(id, project_id, status, created_at) VALUES($1, $2, $3, now())",
      [runId, projectId, "queued"]
    );
    this.logsGateway.emitLog(projectId, `Run ${runId} queued`);

    const response = await fetch(`${this.runnerUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, stack })
    });
    if (!response.ok) {
      const errorText = await response.text();
      await this.database.query("UPDATE runs SET status = $1, logs = $2 WHERE id = $3", ["failed", errorText, runId]);
      this.logsGateway.emitLog(projectId, `Run ${runId} failed: ${errorText}`);
      throw new Error("Runner failed");
    }
    const payload = await response.json();
    const url = new URL(payload.url as string);
    const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
    await this.database.query("UPDATE runs SET status = $1, port = $2, logs = $3, finished_at = now() WHERE id = $4", [
      "completed",
      port,
      `Runner started container ${payload.container}`,
      runId
    ]);
    this.logsGateway.emitLog(projectId, `Run ${runId} ready on ${payload.url}`);
    if (payload.container) {
      void this.forwardLogs(projectId, payload.container as string);
    } else {
      this.logger.warn(`Runner response missing container identifier for project ${projectId}`);
    }
    return { runId, url: payload.url };
  }

  private async forwardLogs(projectId: string, containerId: string) {
    try {
      const response = await fetch(`${this.runnerUrl}/logs/${containerId}`);
      if (!response.ok || !response.body) {
        this.logger.warn(`Unable to stream logs for container ${containerId}: ${response.status}`);
        return;
      }
      const stream = response.body as unknown as NodeJS.ReadableStream;
      stream.on("data", (chunk) => {
        this.logsGateway.emitLog(projectId, chunk.toString());
      });
      stream.on("error", (error) => {
        this.logger.error(`Log stream error for container ${containerId}: ${String(error)}`);
      });
      stream.on("end", () => {
        this.logsGateway.emitLog(projectId, `Container ${containerId} exited`);
      });
    } catch (error) {
      this.logger.error(`Failed to forward logs for container ${containerId}: ${String(error)}`);
    }
  }
}
