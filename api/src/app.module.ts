import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AIModule } from "./ai/ai.module";
import { configuration } from "./config/configuration";
import { DatabaseModule } from "./common/database.module";
import { DeployModule } from "./deploy/deploy.module";
import { FilesModule } from "./files/files.module";
import { ProjectsModule } from "./projects/projects.module";
import { RunModule } from "./run/run.module";
import { WebsocketModule } from "./ws/ws.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    WebsocketModule,
    ProjectsModule,
    FilesModule,
    AIModule,
    RunModule,
    DeployModule
  ]
})
export class AppModule {}
