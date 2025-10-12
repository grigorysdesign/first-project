import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuid } from "uuid";

import { DatabaseService } from "../common/database.service";
import { FilesService } from "../files/files.service";

export interface ProjectEntity {
  id: string;
  name: string;
  stack: "python" | "node" | "static";
  created_at: Date;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly database: DatabaseService, private readonly filesService: FilesService) {}

  async create(payload: { name: string; stack: string }): Promise<{ id: string }> {
    if (!payload.name?.trim()) {
      throw new BadRequestException("Project name is required");
    }
    if (!this.isSupportedStack(payload.stack)) {
      throw new BadRequestException("Unsupported stack");
    }
    const trimmedName = payload.name.trim();
    const id = uuid();
    await this.database.query(
      "INSERT INTO projects(id, name, stack, created_at) VALUES($1, $2, $3, now())",
      [id, trimmedName, payload.stack]
    );
    await this.filesService.ensureProjectDirectory(id);
    await this.seedProject(id, payload.stack as ProjectEntity["stack"]);
    return { id };
  }

  async list(): Promise<ProjectEntity[]> {
    const result = await this.database.query<{
      rows: Array<{ id: string; name: string; stack: string; created_at: Date | string }>;
    }>("SELECT id, name, stack, created_at FROM projects ORDER BY created_at DESC");
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      stack: row.stack as ProjectEntity["stack"],
      created_at: new Date(row.created_at)
    }));
  }

  async getById(projectId: string): Promise<ProjectEntity> {
    const result = await this.database.query<{ rows: ProjectEntity[] }>(
      "SELECT id, name, stack, created_at FROM projects WHERE id = $1",
      [projectId]
    );
    if (!result.rows.length) {
      throw new NotFoundException("Project not found");
    }
    const project = result.rows[0];
    return { ...project, created_at: new Date(project.created_at) };
  }

  async update(projectId: string, payload: { name?: string }): Promise<ProjectEntity> {
    const nextName = payload.name?.trim();
    if (nextName) {
      const updateResult = await this.database.query("UPDATE projects SET name = $1 WHERE id = $2", [nextName, projectId]);
      if (updateResult.rowCount === 0) {
        throw new NotFoundException("Project not found");
      }
    }
    return this.getById(projectId);
  }

  async remove(projectId: string) {
    const result = await this.database.query("DELETE FROM projects WHERE id = $1", [projectId]);
    if (result.rowCount === 0) {
      throw new NotFoundException("Project not found");
    }
    await this.filesService.removeProjectDirectory(projectId);
  }

  private async seedProject(projectId: string, stack: ProjectEntity["stack"]) {
    if (stack === "python") {
      await this.filesService.upsert(
        projectId,
        "app.py",
        `from flask import Flask\napp = Flask(__name__)\n\n\n@app.get('/')\ndef home():\n    return "<h1>Hello from SimpleReplit.AI</h1>"\n\n\nif __name__ == "__main__":\n    app.run(host="0.0.0.0", port=8000)`
      );
      await this.filesService.upsert(projectId, "requirements.txt", "flask\nwatchfiles\nuvicorn\n");
      await this.filesService.upsert(projectId, "Dockerfile", this.pythonDockerfile());
    }
    if (stack === "node") {
      await this.filesService.upsert(
        projectId,
        "index.js",
        `const express = require('express');\nconst app = express();\napp.get('/', (_, res) => res.send('<h1>Hello from SimpleReplit.AI</h1>'));\napp.listen(process.env.PORT || 3000, () => console.log('OK'));`
      );
      await this.filesService.upsert(projectId, "package.json", this.nodePackage());
      await this.filesService.upsert(projectId, "Dockerfile", this.nodeDockerfile());
    }
    if (stack === "static") {
      await this.filesService.upsert(
        projectId,
        "index.html",
        `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>SimpleReplit.AI</title>\n  <link rel="stylesheet" href="style.css" />\n</head>\n<body>\n  <main>\n    <h1>Hello from SimpleReplit.AI</h1>\n    <p>Start editing to see magic.</p>\n  </main>\n  <script src="app.js"></script>\n</body>\n</html>`
      );
      await this.filesService.upsert(
        projectId,
        "style.css",
        `body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display:flex; justify-content:center; align-items:center; height:100vh; }\nmain { text-align:center; }`
      );
      await this.filesService.upsert(projectId, "app.js", "console.log('SimpleReplit.AI ready');");
      await this.filesService.upsert(
        projectId,
        "Dockerfile",
        `FROM node:20-alpine\nRUN npm install -g live-server\nWORKDIR /app\nCOPY . /app\nCMD [\"live-server\", \"--port=4173\", \"--host=0.0.0.0\"]\n`
      );
    }
    await this.filesService.upsert(
      projectId,
      "README.md",
      `# SimpleReplit.AI project\n\nStack: ${stack}\n\n## Commands\n\n- Build docker image: docker build -t app .\n- Run: docker run --rm -p 8000:8000 app\n\nGenerated by SimpleReplit.AI`
    );
  }

  private pythonDockerfile() {
    return `FROM python:3.11-slim\nWORKDIR /app\nCOPY . /app\nRUN pip install --no-cache-dir -r requirements.txt || true\nENV PORT=8000\nCMD [\"python\", \"app.py\"]\n`;
  }

  private nodeDockerfile() {
    return `FROM node:20-alpine\nWORKDIR /app\nCOPY package.json package-lock.json* ./\nRUN npm install\nCOPY . .\nENV PORT=3000\nCMD [\"npm\", \"start\"]\n`;
  }

  private nodePackage() {
    return JSON.stringify(
      {
        name: "simple-node-app",
        version: "1.0.0",
        scripts: {
          start: "node index.js"
        },
        dependencies: {
          express: "^4.18.2"
        }
      },
      null,
      2
    );
  }

  private isSupportedStack(stack: string): stack is ProjectEntity["stack"] {
    return stack === "python" || stack === "node" || stack === "static";
  }
}
