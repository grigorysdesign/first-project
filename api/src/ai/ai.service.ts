import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../common/database.service";
import { FilesService } from "../files/files.service";

import { GeneratedFile, OllamaProvider } from "./llm.provider";

@Injectable()
export class AIService {

  constructor(
    private readonly llmProvider: OllamaProvider,
    private readonly database: DatabaseService,
    private readonly filesService: FilesService
  ) {}

  async generate(projectId: string, prompt: string, stack: "python" | "node" | "static") {
    const files = await this.llmProvider.generateFiles(prompt, stack);
    for (const file of files) {
      await this.filesService.upsert(projectId, file.path, file.content);
    }
    await this.database.query("INSERT INTO runs(project_id, status, logs) VALUES($1, $2, $3)", [
      projectId,
      "completed",
      `AI generated ${files.length} files`
    ]);
    return files;
  }

  async applyDiff(projectId: string, instruction: string) {
    const patches = await this.llmProvider.suggestDiff(projectId, instruction);
    // naive patch application: append patch content to logs table
    await this.database.query("INSERT INTO runs(project_id, status, logs) VALUES($1, $2, $3)", [
      projectId,
      "completed",
      `AI suggested diff: ${instruction}`
    ]);
    return patches;
  }

  async explain(projectId: string, runId: string) {
    const runResult = await this.database.query<{ rows: Array<{ logs: string; project_id: string }> }>(
      "SELECT logs, project_id FROM runs WHERE id = $1",
      [runId]
    );
    if (!runResult.rows.length) {
      throw new Error("Run not found");
    }
    const { logs, project_id: storedProjectId } = runResult.rows[0];
    const effectiveProjectId = projectId ?? storedProjectId;
    const fileRows = await this.database.query<{ rows: GeneratedFile[] }>(
      "SELECT path, content FROM files WHERE project_id = $1",
      [effectiveProjectId]
    );
    return this.llmProvider.explainError(logs ?? "", fileRows.rows);
  }
}
