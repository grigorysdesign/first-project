"use client";

import { useEffect, useState } from "react";
import { api, FileNode } from "../lib/api";

interface FileTreeProps {
  projectId: string;
  activePath?: string;
  onSelect: (path: string) => void;
}

export function FileTree({ projectId, activePath, onSelect }: FileTreeProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFiles = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const result = await api.listProjectFiles(projectId);
      setFiles(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchFiles();
  }, [projectId]);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
        <span>Files</span>
        <button
          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
          onClick={fetchFiles}
        >
          Refresh
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="px-3 py-2 text-xs text-slate-500">Loading...</p>}
        <ul className="space-y-0.5 px-2 py-2 text-sm">
          {files.map((file) => (
            <li key={file.path}>
              <button
                onClick={() => onSelect(file.path)}
                className={`flex w-full items-center justify-between rounded px-2 py-1 text-left transition hover:bg-slate-800 ${
                  activePath === file.path ? "bg-slate-800 text-white" : "text-slate-300"
                }`}
              >
                <span className="truncate">{file.path}</span>
                <span className="text-[10px] text-slate-500">
                  {new Date(file.updated_at).toLocaleTimeString()}
                </span>
              </button>
            </li>
          ))}
          {files.length === 0 && !isLoading && (
            <li className="px-3 py-6 text-center text-sm text-slate-500">
              No files yet. Ask AI to generate them!
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
