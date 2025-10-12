import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { promises as fs } from "fs";
import * as path from "path";

import { DatabaseService } from "../common/database.service";

export interface ProjectFile {
  path: string;
  content: string;
  updated_at: Date;
}

export interface ProjectFileSummary {
  path: string;
  updated_at: Date;
}

@Injectable()
export class FilesService {
  private readonly projectsRoot: string;

  constructor(private readonly database: DatabaseService, private readonly configService: ConfigService) {
    this.projectsRoot =
      this.configService.get<string>("projectsRoot") ?? path.resolve(process.cwd(), "..", "projects-data");
  }

  async ensureProjectDirectory(projectId: string) {
    await fs.mkdir(this.getProjectRoot(projectId), { recursive: true });
  }

  async list(projectId: string): Promise<ProjectFileSummary[]> {
    const result = await this.database.query<{ rows: Array<{ path: string; updated_at: Date | string }> }>(
      "SELECT path, updated_at FROM files WHERE project_id = $1 ORDER BY path",
      [projectId]
    );
    return result.rows.map((row) => ({ path: row.path, updated_at: new Date(row.updated_at) }));
  }

  async exportProjectFiles(projectId: string): Promise<Array<{ path: string; content: string }>> {
    const result = await this.database.query<{ rows: Array<{ path: string; content: string }> }>(
      "SELECT path, content FROM files WHERE project_id = $1 ORDER BY path",
      [projectId]
    );
    return result.rows;
  }

  async read(projectId: string, filePath: string): Promise<ProjectFile> {
    const sanitizedPath = this.sanitizePath(filePath);
    const result = await this.database.query<{ rows: Array<{ path: string; content: string; updated_at: Date | string }> }>(
      "SELECT path, content, updated_at FROM files WHERE project_id = $1 AND path = $2",
      [projectId, sanitizedPath]
    );
    if (!result.rows.length) {
      throw new NotFoundException("File not found");
    }
    const row = result.rows[0];
    return {
      path: row.path,
      content: row.content,
      updated_at: new Date(row.updated_at)
    };
  }

  async readOptional(projectId: string, filePath: string): Promise<ProjectFile | null> {
    const sanitizedPath = this.sanitizePath(filePath);
    const result = await this.database.query<{ rows: Array<{ path: string; content: string; updated_at: Date | string }> }>(
      "SELECT path, content, updated_at FROM files WHERE project_id = $1 AND path = $2",
      [projectId, sanitizedPath]
    );
    if (!result.rows.length) {
      return null;
    }
    const row = result.rows[0];
    return {
      path: row.path,
      content: row.content,
      updated_at: new Date(row.updated_at)
    };
  }

  async upsert(projectId: string, filePath: string, content: string): Promise<ProjectFile> {
    const sanitizedPath = this.sanitizePath(filePath);
    await this.ensureProjectDirectory(projectId);
    const result = await this.database.query<{
      rows: Array<{ path: string; content: string; updated_at: Date | string }>;
    }>(
      `INSERT INTO files (project_id, path, content, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (project_id, path)
       DO UPDATE SET content = EXCLUDED.content, updated_at = now()
       RETURNING path, content, updated_at`,
      [projectId, sanitizedPath, content]
    );

    await this.writeFileOnDisk(projectId, sanitizedPath, content);

    const row = result.rows[0];
    return {
      path: row.path,
      content: row.content,
      updated_at: new Date(row.updated_at)
    };
  }

  async remove(projectId: string, filePath: string) {
    const sanitizedPath = this.sanitizePath(filePath);
    await this.database.query("DELETE FROM files WHERE project_id = $1 AND path = $2", [projectId, sanitizedPath]);
    const diskPath = this.resolveOnDisk(projectId, sanitizedPath);
    await fs.rm(diskPath, { force: true });
  }

  async removeProjectDirectory(projectId: string) {
    await fs.rm(this.getProjectRoot(projectId), { recursive: true, force: true });
  }

  private sanitizePath(filePath: string) {
    if (!filePath || typeof filePath !== "string") {
      throw new BadRequestException("File path is required");
    }
    const normalized = filePath.replace(/\\/g, "/");
    const segments = normalized.split("/");
    if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
      throw new BadRequestException("Invalid file path");
    }
    return segments.join("/");
  }

  private getProjectRoot(projectId: string) {
    return path.join(this.projectsRoot, projectId);
  }

  private resolveOnDisk(projectId: string, sanitizedPath: string) {
    const projectRoot = this.getProjectRoot(projectId);
    const absolute = path.join(projectRoot, sanitizedPath);
    if (!absolute.startsWith(projectRoot)) {
      throw new BadRequestException("File path escapes project root");
    }
    return absolute;
  }

  private async writeFileOnDisk(projectId: string, sanitizedPath: string, content: string) {
    const fileLocation = this.resolveOnDisk(projectId, sanitizedPath);
    await fs.mkdir(path.dirname(fileLocation), { recursive: true });
    await fs.writeFile(fileLocation, content, "utf8");
  }
}
