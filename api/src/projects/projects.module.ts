import { Module } from "@nestjs/common";

import { DatabaseModule } from "../common/database.module";
import { FilesModule } from "../files/files.module";

import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [DatabaseModule, FilesModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
