import { Body, Controller, Post } from "@nestjs/common";
import { ProjectsService } from "../projects/projects.service";

import { AIService } from "./ai.service";

@Controller("api/ai")
export class AIController {
  constructor(private readonly aiService: AIService, private readonly projectsService: ProjectsService) {}

  @Post("/generate")
  async generate(@Body() body: { projectId: string; prompt: string }) {
    const project = await this.projectsService.getById(body.projectId);
    const files = await this.aiService.generate(body.projectId, body.prompt, project.stack as "python" | "node" | "static");
    return { message: `Generated ${files.length} files`, files };
  }

  @Post("/diff")
  async diff(@Body() body: { projectId: string; instruction: string }) {
    const patches = await this.aiService.applyDiff(body.projectId, body.instruction);
    return { message: `Diff suggestion prepared`, patches };
  }

  @Post("/explain-error")
  async explain(@Body() body: { projectId: string; runId: string }) {
    const explanation = await this.aiService.explain(body.projectId, body.runId);
    return { explanation };
  }
}
