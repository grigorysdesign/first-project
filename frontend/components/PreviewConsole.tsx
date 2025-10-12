"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "../lib/api";

type TabKey = "preview" | "logs";

interface PreviewConsoleProps {
  projectId: string;
}

export function PreviewConsole({ projectId }: PreviewConsoleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("preview");
  const [runUrl, setRunUrl] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>("Click Run to start the container\n");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const run = await api.runProject({ projectId });
      setRunUrl(run.url);
      setActiveTab("preview");
      setLogs((prev) => `${prev}\nRun started: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error(error);
      setLogs((prev) => `${prev}\n${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const deploy = await api.deployProject({ projectId });
      setDeploymentUrl(deploy.url);
      setActiveTab("preview");
      setLogs((prev) => `${prev}\nDeployment ready at ${deploy.url}`);
    } catch (error) {
      console.error(error);
      setLogs((prev) => `${prev}\n${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRunUrl(null);
    setDeploymentUrl(null);
    setLogs("Click Run to start the container\n");
    let socket: Socket | null = null;
    if (projectId) {
      socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") || "ws://localhost:8080");
      socket.on(`logs:${projectId}`, (event: { message: string; timestamp: string }) => {
        setLogs((prev) => `${prev}\n[${new Date(event.timestamp).toLocaleTimeString()}] ${event.message}`);
      });
    }
    return () => {
      socket?.disconnect();
    };
  }, [projectId]);

  return (
    <section className="flex h-full w-96 flex-col border-l border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("preview")}
            className={`rounded px-2 py-1 text-xs ${activeTab === "preview" ? "bg-slate-800 text-white" : "text-slate-300"}`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`rounded px-2 py-1 text-xs ${activeTab === "logs" ? "bg-slate-800 text-white" : "text-slate-300"}`}
          >
            Logs
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            className="rounded bg-brand-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
            disabled={loading}
          >
            Run
          </button>
          <button
            onClick={handleDeploy}
            className="rounded border border-brand-600 px-3 py-1 text-xs font-semibold text-brand-500 disabled:opacity-40"
            disabled={loading}
          >
            Deploy
          </button>
        </div>
      </div>
      <div className="flex-1">
        {activeTab === "preview" ? (
          <div className="h-full">
            {runUrl ? (
              <iframe src={runUrl} className="h-full w-full bg-white" title="Preview" />
            ) : deploymentUrl ? (
              <iframe src={deploymentUrl} className="h-full w-full bg-white" title="Deployment" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Preview will appear here after you run the project.
              </div>
            )}
          </div>
        ) : (
          <pre className="h-full overflow-auto bg-slate-950 p-3 text-xs text-slate-300">{logs}</pre>
        )}
      </div>
    </section>
  );
}
