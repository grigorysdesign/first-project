import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";

import { FilesService } from "./files.service";

@Controller("api/projects/:projectId")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get("/files")
  async list(@Param("projectId") projectId: string) {
    return this.filesService.list(projectId);
  }

  @Get("/file")
  async read(@Param("projectId") projectId: string, @Query("path") path: string) {
    const file = await this.filesService.read(projectId, path);
    return { content: file.content };
  }

  @Post("/file")
  async save(@Param("projectId") projectId: string, @Body() body: { path: string; content: string }) {
    await this.filesService.upsert(projectId, body.path, body.content);
    return { ok: true };
  }

  @Delete("/file")
  async remove(@Param("projectId") projectId: string, @Query("path") path: string) {
    await this.filesService.remove(projectId, path);
    return { ok: true };
  }
}
