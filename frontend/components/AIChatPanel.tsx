"use client";

import { FormEvent, useState } from "react";
import { api } from "../lib/api";

interface AIChatPanelProps {
  projectId: string;
  onFilesUpdated?: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChatPanel({ projectId, onFilesUpdated }: AIChatPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const pushMessage = (message: Message) => setMessages((prev) => [...prev, message]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    const userMessage: Message = { role: "user", content: prompt.trim() };
    pushMessage(userMessage);
    setPrompt("");
    setIsLoading(true);
    try {
      const result = await api.aiGenerate({ projectId, prompt: userMessage.content });
      pushMessage({ role: "assistant", content: result.message });
      onFilesUpdated?.();
    } catch (error) {
      pushMessage({ role: "assistant", content: `Ошибка: ${String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiff = async () => {
    if (!prompt.trim()) return;
    const userMessage: Message = { role: "user", content: prompt.trim() };
    pushMessage(userMessage);
    setPrompt("");
    setIsLoading(true);
    try {
      const result = await api.aiDiff({ projectId, instruction: userMessage.content });
      pushMessage({ role: "assistant", content: result.message });
      onFilesUpdated?.();
    } catch (error) {
      pushMessage({ role: "assistant", content: `Ошибка: ${String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex h-[320px] flex-col border-t border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
        <span>AI Assistant</span>
      </div>
      <div className="flex-1 space-y-2 overflow-auto p-3 text-sm">
        {messages.map((message, index) => (
          <div key={index} className={`rounded border px-3 py-2 ${message.role === "assistant" ? "border-slate-700 bg-slate-900" : "border-brand-600 bg-slate-900/40"}`}>
            <div className="text-xs uppercase tracking-wide text-slate-500">{message.role}</div>
            <div className="whitespace-pre-wrap text-slate-200">{message.content}</div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-xs text-slate-500">
            Попробуйте запрос «Сделай To-Do на Flask» или «Поменяй цвет кнопки на зелёный».
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="h-20 w-full rounded border border-slate-800 bg-slate-950 p-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
          placeholder="Опишите, что нужно сделать..."
        />
        <div className="mt-2 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={handleDiff}
            disabled={isLoading}
            className="rounded border border-brand-500 px-3 py-1 font-semibold text-brand-500 disabled:opacity-40"
          >
            Apply diff
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded bg-brand-600 px-3 py-1 font-semibold text-white disabled:opacity-40"
          >
            Generate
          </button>
        </div>
      </form>
    </section>
  );
}
