import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import type { Project } from "./lib/types";
import NewProjectForm from "./components/NewProjectForm";
import ProjectDetail from "./components/ProjectDetail";

type View = { name: "list" } | { name: "new" } | { name: "detail"; projectId: string };

export default function App() {
  const [view, setView] = useState<View>({ name: "list" });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadProjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProjects(data as Project[]);
    setLoading(false);
  }

  useEffect(() => {
    if (view.name === "list") loadProjects();
  }, [view.name]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This removes all its scenes, shots, and rendered videos. This can't be undone.`)) {
      return;
    }
    setDeletingId(id);
    await supabase.from("projects").delete().eq("id", id);
    setDeletingId(null);
    loadProjects();
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="border-b border-white/10 px-6 py-5 flex items-center justify-between sticky top-0 bg-charcoal/95 backdrop-blur z-10">
        <button
          onClick={() => setView({ name: "list" })}
          className="flex items-center gap-2 group"
        >
          <span className="w-1 h-5 bg-accent" />
          <span className="text-lg font-bold tracking-wide">
            <span className="text-white">SCENE</span>
            <span className="text-accent">FORGE</span>
          </span>
        </button>
        <nav className="flex items-center gap-6 text-xs font-medium tracking-widest uppercase text-gray-500">
          <button
            onClick={() => setView({ name: "list" })}
            className={view.name === "list" ? "text-gray-100" : "hover:text-gray-300 transition"}
          >
            Cases
          </button>
          {view.name !== "new" && (
            <button
              onClick={() => setView({ name: "new" })}
              className="bg-accent hover:bg-accent/80 text-white normal-case tracking-normal text-sm font-semibold px-4 py-2 rounded-md transition"
            >
              + New Case
            </button>
          )}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {view.name === "list" && (
          <ProjectList
            projects={projects}
            loading={loading}
            deletingId={deletingId}
            onOpen={(id) => setView({ name: "detail", projectId: id })}
            onNew={() => setView({ name: "new" })}
            onDelete={handleDelete}
          />
        )}

        {view.name === "new" && (
          <NewProjectForm
            onCreated={(id) => setView({ name: "detail", projectId: id })}
            onCancel={() => setView({ name: "list" })}
          />
        )}

        {view.name === "detail" && (
          <ProjectDetail projectId={view.projectId} onBack={() => setView({ name: "list" })} />
        )}
      </main>
    </div>
  );
}

function ProjectList({
  projects,
  loading,
  deletingId,
  onOpen,
  onNew,
  onDelete,
}: {
  projects: Project[];
  loading: boolean;
  deletingId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string, title: string) => void;
}) {
  if (loading) return <p className="text-gray-500 text-sm">Loading cases…</p>;

  if (projects.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-white/10 rounded-lg">
        <p className="text-gray-500 mb-4 text-sm uppercase tracking-widest">No cases on file</p>
        <button
          onClick={onNew}
          className="bg-accent hover:bg-accent/80 text-white font-semibold px-5 py-2.5 rounded-md transition"
        >
          Open your first case
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
        {projects.length} case{projects.length !== 1 ? "s" : ""} on file
      </h2>
      <div className="grid gap-3">
        {projects.map((p) => (
          <div
            key={p.id}
            className="group relative bg-panel border border-white/10 rounded-lg p-4 hover:border-accent/40 transition"
          >
            <button onClick={() => onOpen(p.id)} className="text-left w-full pr-10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                  Case File
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gray-600">
                  {p.input_mode}
                </span>
              </div>
              <h3 className="font-semibold text-gray-100 mt-1">{p.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(p.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </button>
            <button
              onClick={() => onDelete(p.id, p.title)}
              disabled={deletingId === p.id}
              title="Delete case"
              className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
            >
              {deletingId === p.id ? (
                <span className="text-xs">…</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
