import { Module } from "@nestjs/common";

import { DatabaseModule } from "../common/database.module";
import { ProjectsModule } from "../projects/projects.module";
import { WebsocketModule } from "../ws/ws.module";

import { RunController } from "./run.controller";
import { RunService } from "./run.service";

@Module({
  imports: [DatabaseModule, ProjectsModule, WebsocketModule],
  controllers: [RunController],
  providers: [RunService],
  exports: [RunService]
})
export class RunModule {}
