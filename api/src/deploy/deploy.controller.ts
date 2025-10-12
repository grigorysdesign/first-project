import { Body, Controller, Post } from "@nestjs/common";

import { ProjectsService } from "../projects/projects.service";

import { DeployService } from "./deploy.service";

@Controller("api")
export class DeployController {
  constructor(private readonly deployService: DeployService, private readonly projectsService: ProjectsService) {}

  @Post("/deploy")
  async deploy(@Body() body: { projectId: string }) {
    await this.projectsService.getById(body.projectId);
    return this.deployService.createDeployment(body.projectId);
  }
}
