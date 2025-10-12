import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { IsString, IsUUID } from "class-validator";

import { FilesService } from "./files.service";

class ProjectParamDto {
  @IsUUID()
  projectId!: string;
}

class FileQueryDto {
  @IsString()
  path!: string;
}

class UpsertFileDto {
  @IsString()
  path!: string;

  @IsString()
  content!: string;
}

@Controller("api/projects/:projectId")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get("/files")
  async list(@Param() params: ProjectParamDto) {
    const files = await this.filesService.list(params.projectId);
    return files.map((file) => ({ path: file.path, updated_at: file.updated_at.toISOString() }));
  }

  @Get("/file")
  async read(@Param() params: ProjectParamDto, @Query() query: FileQueryDto) {
    const file = await this.filesService.read(params.projectId, query.path);
    return { content: file.content, updated_at: file.updated_at.toISOString() };
  }

  @Post("/file")
  async save(@Param() params: ProjectParamDto, @Body() body: UpsertFileDto) {
    const file = await this.filesService.upsert(params.projectId, body.path, body.content);
    return { path: file.path, updated_at: file.updated_at.toISOString() };
  }

  @Delete("/file")
  async remove(@Param() params: ProjectParamDto, @Query() query: FileQueryDto) {
    await this.filesService.remove(params.projectId, query.path);
    return { ok: true };
  }
}
