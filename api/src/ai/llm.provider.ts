import fetch from "cross-fetch";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface SuggestedPatch {
  path: string;
  patch: string;
}

export interface LLMProvider {
  generateFiles(prompt: string, stack: "python" | "node" | "static"): Promise<GeneratedFile[]>;
  suggestDiff(projectId: string, instruction: string): Promise<SuggestedPatch[]>;
  explainError(logs: string, filesContext: GeneratedFile[]): Promise<string>;
}

@Injectable()
export class OllamaProvider implements LLMProvider {
  constructor(private readonly configService: ConfigService) {}

  private get url() {
    return this.configService.get<string>("ollamaUrl") ?? "http://localhost:11434";
  }

  async generateFiles(prompt: string, stack: "python" | "node" | "static"): Promise<GeneratedFile[]> {
    const response = await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:7b",
        prompt: this.composePrompt(prompt, stack)
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const text = await response.text();
    const files = this.extractFiles(text);
    return files;
  }

  async suggestDiff(_projectId: string, instruction: string): Promise<SuggestedPatch[]> {
    const response = await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:7b",
        prompt: `Предложи diff в формате unified для инструкции: ${instruction}`
      })
    });
    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }
    return [
      {
        path: "diff.patch",
        patch: await response.text()
      }
    ];
  }

  async explainError(logs: string, filesContext: GeneratedFile[]): Promise<string> {
    const response = await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:7b",
        prompt: `Вот логи ошибки: ${logs}\nВот файлы: ${JSON.stringify(filesContext)}\nОбъясни причину ошибки и предложи исправление.`
      })
    });
    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }
    return await response.text();
  }

  private composePrompt(prompt: string, stack: string) {
    return `Ты — помощник SimpleReplit.AI. Подготовь список файлов с содержимым в JSON-массиве вида [{"path":"...","content":"..."}]. Стек: ${stack}.\n` +
      `Запрос пользователя: ${prompt}.`;
  }

  private extractFiles(text: string): GeneratedFile[] {
    try {
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]");
      if (jsonStart >= 0 && jsonEnd >= jsonStart) {
        const json = text.slice(jsonStart, jsonEnd + 1);
        return JSON.parse(json);
      }
      return [];
    } catch (error) {
      console.error("Failed to parse ollama response", error);
      return [];
    }
  }
}
