import { Body, Controller, Post } from "@nestjs/common";

import { ProjectsService } from "./projects.service";

@Controller("api/projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() body: { name: string; stack: "python" | "node" | "static" }) {
    const project = await this.projectsService.create(body);
    return { projectId: project.id };
  }
}
