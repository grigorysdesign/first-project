export interface Project {
  id: string;
  name: string;
  stack: "python" | "node" | "static";
  created_at: string;
}

export interface FileNode {
  path: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listProjects: () => request<Project[]>(`/api/projects`),
  createProject: (payload: { name: string; stack: Project["stack"] }) =>
    request<{ projectId: string; project: Project }>(`/api/projects`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listProjectFiles: (projectId: string) =>
    request<FileNode[]>(`/api/projects/${projectId}/files`),
  readFile: (projectId: string, path: string) =>
    request<{ content: string }>(`/api/projects/${projectId}/file?path=${encodeURIComponent(path)}`),
  saveFile: (projectId: string, payload: { path: string; content: string }) =>
    request<void>(`/api/projects/${projectId}/file`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteFile: (projectId: string, path: string) =>
    request<void>(`/api/projects/${projectId}/file?path=${encodeURIComponent(path)}`, {
      method: "DELETE"
    }),
  aiGenerate: (payload: { projectId: string; prompt: string }) =>
    request<{ files: Array<{ path: string; updated_at: string }>; message: string }>(`/api/ai/generate`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  aiDiff: (payload: { projectId: string; instruction: string }) =>
    request<{ files: Array<{ path: string; updated_at: string }>; message: string }>(`/api/ai/diff`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  aiExplain: (payload: { projectId: string; runId: string }) =>
    request<{ explanation: string }>(`/api/ai/explain-error`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  runProject: (payload: { projectId: string }) =>
    request<{ runId: string; url: string }>(`/api/run`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deployProject: (payload: { projectId: string }) =>
    request<{ deploymentId: string; url: string }>(`/api/deploy`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
