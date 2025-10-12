import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../common/database.service";

export interface ProjectFile {
  path: string;
  content: string;
  updated_at: Date;
}

@Injectable()
export class FilesService {
  constructor(private readonly database: DatabaseService) {}

  async list(projectId: string) {
    const result = await this.database.query<{ rows: Array<{ path: string; updated_at: Date }> }>(
      "SELECT path, updated_at FROM files WHERE project_id = $1 ORDER BY path",
      [projectId]
    );
    return result.rows;
  }

  async read(projectId: string, path: string) {
    const result = await this.database.query<{ rows: ProjectFile[] }>(
      "SELECT path, content, updated_at FROM files WHERE project_id = $1 AND path = $2",
      [projectId, path]
    );
    if (!result.rows.length) {
      throw new Error("File not found");
    }
    return result.rows[0];
  }

  async upsert(projectId: string, path: string, content: string) {
    await this.database.query(
      `INSERT INTO files (project_id, path, content, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (project_id, path)
       DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
      [projectId, path, content]
    );
  }

  async remove(projectId: string, path: string) {
    await this.database.query("DELETE FROM files WHERE project_id = $1 AND path = $2", [projectId, path]);
  }
}
