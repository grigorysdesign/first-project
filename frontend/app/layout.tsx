import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SimpleReplit.AI",
  description: "Онлайн IDE с ИИ-помощником"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-slate-950 text-slate-100">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-brand-500">SimpleReplit.AI</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">MVP</span>
              </div>
              <nav className="flex items-center gap-4 text-sm text-slate-300">
                <a className="hover:text-white" href="#workspace">Workspace</a>
                <a className="hover:text-white" href="#metrics">Metrics</a>
                <a className="hover:text-white" href="https://ollama.ai" target="_blank" rel="noreferrer">
                  Ollama
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
