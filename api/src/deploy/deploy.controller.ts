import { Body, Controller, Post } from "@nestjs/common";
import { IsUUID } from "class-validator";

import { ProjectsService } from "../projects/projects.service";

import { DeployService } from "./deploy.service";

class DeployDto {
  @IsUUID()
  projectId!: string;
}

@Controller("api")
export class DeployController {
  constructor(private readonly deployService: DeployService, private readonly projectsService: ProjectsService) {}

  @Post("/deploy")
  async deploy(@Body() body: DeployDto) {
    await this.projectsService.getById(body.projectId);
    return this.deployService.createDeployment(body.projectId);
  }
}
