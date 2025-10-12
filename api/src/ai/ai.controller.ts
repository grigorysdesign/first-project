import { Body, Controller, Post } from "@nestjs/common";
import { IsString, IsUUID } from "class-validator";
import { ProjectsService } from "../projects/projects.service";

import { AIService } from "./ai.service";

class GenerateDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  prompt!: string;
}

class DiffDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  instruction!: string;
}

class ExplainDto {
  @IsUUID()
  projectId!: string;

  @IsUUID()
  runId!: string;
}

@Controller("api/ai")
export class AIController {
  constructor(private readonly aiService: AIService, private readonly projectsService: ProjectsService) {}

  @Post("/generate")
  async generate(@Body() body: GenerateDto) {
    const project = await this.projectsService.getById(body.projectId);
    const result = await this.aiService.generate(body.projectId, body.prompt, project.stack);
    return {
      message: result.message,
      files: result.files.map((file) => ({ path: file.path, updated_at: file.updated_at.toISOString() }))
    };
  }

  @Post("/diff")
  async diff(@Body() body: DiffDto) {
    const project = await this.projectsService.getById(body.projectId);
    const result = await this.aiService.applyDiff(body.projectId, body.instruction, project.stack);
    return {
      message: result.message,
      files: result.files.map((file) => ({ path: file.path, updated_at: file.updated_at.toISOString() }))
    };
  }

  @Post("/explain-error")
  async explain(@Body() body: ExplainDto) {
    const explanation = await this.aiService.explain(body.projectId, body.runId);
    return { explanation };
  }
}
