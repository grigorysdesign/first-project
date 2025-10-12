import { Injectable, Logger } from "@nestjs/common";
import { applyPatch, parsePatch } from "diff";

import { DatabaseService } from "../common/database.service";
import { FilesService, ProjectFile } from "../files/files.service";

import { GeneratedFile, OllamaProvider, SuggestedPatch } from "./llm.provider";

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly llmProvider: OllamaProvider,
    private readonly database: DatabaseService,
    private readonly filesService: FilesService
  ) {}

  async generate(
    projectId: string,
    prompt: string,
    stack: "python" | "node" | "static"
  ): Promise<{ message: string; files: ProjectFile[] }> {
    let generated: GeneratedFile[] = [];
    let message = "AI generated files";
    try {
      generated = await this.llmProvider.generateFiles(prompt, stack);
    } catch (error) {
      this.logger.warn(`LLM generate failed: ${String(error)}`);
      generated = [];
    }

    if (!generated.length) {
      generated = this.fallbackFiles(stack, prompt);
      message = "LLM unavailable, fallback snippet created";
    }

    const savedFiles: ProjectFile[] = [];
    for (const file of generated) {
      const saved = await this.filesService.upsert(projectId, file.path, file.content);
      savedFiles.push(saved);
    }

    return { message: `${message}: ${savedFiles.length} file(s)`, files: savedFiles };
  }

  async applyDiff(
    projectId: string,
    instruction: string,
    stack: "python" | "node" | "static"
  ): Promise<{ message: string; files: ProjectFile[] }> {
    const context = await this.filesService.exportProjectFiles(projectId);
    let patches: SuggestedPatch[] = [];
    try {
      patches = await this.llmProvider.suggestDiff(projectId, this.composeDiffInstruction(instruction, context, stack), context);
    } catch (error) {
      this.logger.warn(`LLM diff failed: ${String(error)}`);
      patches = [];
    }

    const applied: ProjectFile[] = [];
    for (const patch of patches) {
      const updatedFiles = await this.applyPatchSuggestion(projectId, patch);
      applied.push(...updatedFiles);
    }

    const message = applied.length
      ? `Updated ${applied.length} file(s) with AI diff`
      : "No changes were applied";

    return { message, files: applied };
  }

  async explain(projectId: string, runId: string) {
    const runResult = await this.database.query<{ rows: Array<{ logs: string; project_id: string }> }>(
      "SELECT logs, project_id FROM runs WHERE id = $1",
      [runId]
    );
    if (!runResult.rows.length) {
      throw new Error("Run not found");
    }
    const { logs, project_id: storedProjectId } = runResult.rows[0];
    const effectiveProjectId = projectId ?? storedProjectId;
    const fileRows = await this.database.query<{ rows: GeneratedFile[] }>(
      "SELECT path, content FROM files WHERE project_id = $1",
      [effectiveProjectId]
    );
    return this.llmProvider.explainError(logs ?? "", fileRows.rows);
  }

  private fallbackFiles(stack: "python" | "node" | "static", prompt: string): GeneratedFile[] {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const notesPath = `notes/${stack}-${timestamp}.md`;
    return [
      {
        path: notesPath,
        content: `# TODO\n\nStack: ${stack}\n\nPrompt:\n${prompt}\n`
      }
    ];
  }

  private composeDiffInstruction(
    instruction: string,
    context: Array<{ path: string; content: string }>,
    stack: "python" | "node" | "static"
  ) {
    const preview = context.slice(0, 10);
    return `Стек проекта: ${stack}. Инструкция: ${instruction}.\nТекущие файлы:${
      preview.length ? "\n" + JSON.stringify(preview) : " отсутствуют"
    }.`;
  }

  private async applyPatchSuggestion(projectId: string, patch: SuggestedPatch): Promise<ProjectFile[]> {
    const parsed = parsePatch(patch.patch);
    if (!parsed.length) {
      if (patch.path && patch.path !== "diff.patch" && patch.patch.trim().length) {
        const saved = await this.filesService.upsert(projectId, patch.path, patch.patch);
        return [saved];
      }
      return [];
    }

    const updated: ProjectFile[] = [];

    for (const filePatch of parsed) {
      const targetPath = this.resolvePatchPath(filePatch, patch.path);
      if (!targetPath) {
        continue;
      }
      const existing = await this.filesService.readOptional(projectId, targetPath);
      const baseContent = existing?.content ?? "";
      const nextContent = applyPatch(baseContent, filePatch);
      if (nextContent === false) {
        this.logger.warn(`Failed to apply patch for ${targetPath}`);
        continue;
      }
      const saved = await this.filesService.upsert(projectId, targetPath, nextContent);
      updated.push(saved);
    }

    return updated;
  }

  private resolvePatchPath(filePatch: ReturnType<typeof parsePatch>[number], fallbackPath?: string) {
    const candidates = [filePatch.newFileName, filePatch.oldFileName, fallbackPath].filter(Boolean) as string[];
    for (const candidate of candidates) {
      const cleaned = candidate.replace(/^([ab]\/)*/, "");
      if (cleaned && cleaned !== "/dev/null") {
        return cleaned;
      }
    }
    return null;
  }
}
