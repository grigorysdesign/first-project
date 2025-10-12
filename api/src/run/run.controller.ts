import { Body, Controller, Post } from "@nestjs/common";
import { IsUUID } from "class-validator";

import { ProjectsService } from "../projects/projects.service";

import { RunService } from "./run.service";

class RunDto {
  @IsUUID()
  projectId!: string;
}

@Controller("api")
export class RunController {
  constructor(private readonly runService: RunService, private readonly projectsService: ProjectsService) {}

  @Post("/run")
  async run(@Body() body: RunDto) {
    const project = await this.projectsService.getById(body.projectId);
    return this.runService.createRun(body.projectId, project.stack);
  }
}
