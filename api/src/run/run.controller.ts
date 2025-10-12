import { Body, Controller, Post } from "@nestjs/common";

import { ProjectsService } from "../projects/projects.service";

import { RunService } from "./run.service";

@Controller("api")
export class RunController {
  constructor(private readonly runService: RunService, private readonly projectsService: ProjectsService) {}

  @Post("/run")
  async run(@Body() body: { projectId: string }) {
    const project = await this.projectsService.getById(body.projectId);
    return this.runService.createRun(body.projectId, project.stack);
  }
}
