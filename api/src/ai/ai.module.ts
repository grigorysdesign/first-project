import { Module } from "@nestjs/common";

import { DatabaseModule } from "../common/database.module";
import { FilesModule } from "../files/files.module";
import { ProjectsModule } from "../projects/projects.module";

import { AIController } from "./ai.controller";
import { AIService } from "./ai.service";
import { OllamaProvider } from "./llm.provider";

@Module({
  imports: [DatabaseModule, ProjectsModule, FilesModule],
  controllers: [AIController],
  providers: [AIService, OllamaProvider],
  exports: [AIService]
})
export class AIModule {}
