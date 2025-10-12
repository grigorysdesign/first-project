"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { api } from "../lib/api";
import { FileTree } from "../components/FileTree";
import { EditorPane } from "../components/EditorPane";
import { PreviewConsole } from "../components/PreviewConsole";
import { AIChatPanel } from "../components/AIChatPanel";

type StackOption = {
  value: "python" | "node" | "static";
  label: string;
  description: string;
};

const STACKS: StackOption[] = [
  { value: "python", label: "Python + Flask", description: "uvicorn + watchfiles" },
  { value: "node", label: "Node.js + Express", description: "nodemon" },
  { value: "static", label: "Static", description: "live-server" }
];

interface ActiveProject {
  id: string;
  stack: StackOption["value"];
  name: string;
}

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stack, setStack] = useState<StackOption>(STACKS[0]);
  const [name, setName] = useState("Untitled project");
  const [project, setProject] = useState<ActiveProject | null>(null);
  const [activePath, setActivePath] = useState<string | undefined>();
  const [lastRefreshKey, setLastRefreshKey] = useState(0);

  const createProject = async () => {
    const result = await api.createProject({ name, stack: stack.value });
    setProject({ id: result.projectId, stack: stack.value, name });
    setIsModalOpen(false);
    setActivePath(undefined);
    setLastRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  const stackLabel = useMemo(() => STACKS.find((item) => item.value === project?.stack)?.label, [project]);

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-7xl gap-4 px-6 py-4">
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-white">Создать новый проект</Dialog.Title>
            <p className="mt-2 text-sm text-slate-400">
              Выберите стек и укажите название. Проект будет создан мгновенно.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs uppercase text-slate-400">Название</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <Listbox value={stack} onChange={setStack}>
                  <Listbox.Label className="text-xs uppercase text-slate-400">Стек</Listbox.Label>
                  <div className="relative mt-1">
                    <Listbox.Button className="relative w-full cursor-pointer rounded border border-slate-800 bg-slate-950 py-2 pl-3 pr-10 text-left text-sm">
                      <span className="block truncate text-slate-100">{stack.label}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-800 bg-slate-900 py-1 text-sm shadow-lg focus:outline-none">
                        {STACKS.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            value={option}
                            className={({ active }) =>
                              `relative cursor-pointer select-none px-4 py-2 ${
                                active ? "bg-brand-600/60 text-white" : "text-slate-200"
                              }`
                            }
                          >
                            <div className="font-semibold">{option.label}</div>
                            <div className="text-xs text-slate-400">{option.description}</div>
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => void createProject()}
                className="inline-flex items-center gap-2 rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
              >
                <PlusIcon className="h-4 w-4" />
                Create project
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {project ? (
        <div className="flex h-full flex-1 flex-col rounded-lg border border-slate-800 bg-slate-900/50 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-sm text-slate-300">
            <div>
              <div className="text-lg font-semibold text-white">{project.name}</div>
              <div className="text-xs uppercase text-slate-500">{stackLabel}</div>
            </div>
            <button
              className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              onClick={() => setIsModalOpen(true)}
            >
              New project
            </button>
          </div>
          <div className="flex flex-1">
            <FileTree
              key={lastRefreshKey}
              projectId={project.id}
              activePath={activePath}
              onSelect={setActivePath}
            />
            <EditorPane projectId={project.id} path={activePath} />
            <div className="flex w-96 flex-col">
              <PreviewConsole projectId={project.id} />
              <AIChatPanel projectId={project.id} onFilesUpdated={() => setLastRefreshKey((prev) => prev + 1)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed border-slate-700 text-slate-500">
          Создайте проект, чтобы начать работу.
        </div>
      )}
    </div>
  );
}
