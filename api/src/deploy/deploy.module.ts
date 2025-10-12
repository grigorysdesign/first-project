import { Module } from "@nestjs/common";

import { DatabaseModule } from "../common/database.module";
import { ProjectsModule } from "../projects/projects.module";

import { DeployController } from "./deploy.controller";
import { DeployService } from "./deploy.service";

@Module({
  imports: [DatabaseModule, ProjectsModule],
  controllers: [DeployController],
  providers: [DeployService],
  exports: [DeployService]
})
export class DeployModule {}
