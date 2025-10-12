import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";

import { DatabaseService } from "../common/database.service";

@Injectable()
export class DeployService {
  constructor(private readonly database: DatabaseService) {}

  async createDeployment(projectId: string) {
    const id = uuid();
    const url = `http://localhost:5000/preview/${id}`;
    await this.database.query(
      "INSERT INTO deployments(id, project_id, url, status, created_at) VALUES($1, $2, $3, $4, now())",
      [id, projectId, url, "ready"]
    );
    return { deploymentId: id, url };
  }
}
