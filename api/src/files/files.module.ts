import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { DatabaseModule } from "../common/database.module";

import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule {}
