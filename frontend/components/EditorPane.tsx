"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EditorPaneProps {
  projectId: string;
  path?: string;
}

export function EditorPane({ projectId, path }: EditorPaneProps) {
  const [value, setValue] = useState("// Select a file to start editing\n");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!path) return;
      setIsLoading(true);
      try {
        const file = await api.readFile(projectId, path);
        setValue(file.content);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [projectId, path]);

  const language = useMemo(() => {
    if (!path) return "plaintext";
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".js")) return "javascript";
    if (path.endsWith(".py")) return "python";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".css")) return "css";
    return "plaintext";
  }, [path]);

  const handleSave = async () => {
    if (!projectId || !path) return;
    setIsSaving(true);
    try {
      await api.saveFile(projectId, { path, content: value });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex h-full flex-1 flex-col bg-slate-950" id="workspace">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-medium text-slate-200">{path || "No file selected"}</span>
          {isLoading && <span className="text-xs text-amber-400">Loading...</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={!path || isSaving}
          className="rounded bg-brand-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={(next) => setValue(next ?? "")}
          options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
        />
      </div>
    </section>
  );
}
