import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

import { ProjectsService } from "./projects.service";

class ProjectParamDto {
  @IsUUID()
  projectId!: string;
}

class CreateProjectDto {
  @IsString()
  name!: string;

  @IsIn(["python", "node", "static"])
  stack!: "python" | "node" | "static";
}

class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;
}

@Controller("api/projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async list() {
    const projects = await this.projectsService.list();
    return projects.map((project) => this.toResponse(project));
  }

  @Post()
  async create(@Body() body: CreateProjectDto) {
    const project = await this.projectsService.create(body);
    const fullProject = await this.projectsService.getById(project.id);
    return { projectId: project.id, project: this.toResponse(fullProject) };
  }

  @Get(":projectId")
  async get(@Param() params: ProjectParamDto) {
    const project = await this.projectsService.getById(params.projectId);
    return this.toResponse(project);
  }

  @Patch(":projectId")
  async update(@Param() params: ProjectParamDto, @Body() body: UpdateProjectDto) {
    const project = await this.projectsService.update(params.projectId, body);
    return this.toResponse(project);
  }

  @Delete(":projectId")
  async remove(@Param() params: ProjectParamDto) {
    await this.projectsService.remove(params.projectId);
    return { ok: true };
  }

  private toResponse(project: { id: string; name: string; stack: "python" | "node" | "static"; created_at: Date }) {
    return {
      id: project.id,
      name: project.name,
      stack: project.stack,
      created_at: project.created_at.toISOString()
    };
  }
}
