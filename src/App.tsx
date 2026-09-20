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

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => setView({ name: "list" })}
          className="text-lg font-semibold tracking-tight text-gray-100"
        >
          SceneForge<span className="text-accent">.</span>
        </button>
        {view.name !== "new" && (
          <button
            onClick={() => setView({ name: "new" })}
            className="bg-accent hover:bg-accent/80 text-white text-sm font-medium px-4 py-2 rounded-md transition"
          >
            + New Project
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {view.name === "list" && (
          <ProjectList
            projects={projects}
            loading={loading}
            onOpen={(id) => setView({ name: "detail", projectId: id })}
            onNew={() => setView({ name: "new" })}
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
  onOpen,
  onNew,
}: {
  projects: Project[];
  loading: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  if (loading) return <p className="text-gray-400">Loading projects…</p>;

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">No projects yet.</p>
        <button
          onClick={onNew}
          className="bg-accent hover:bg-accent/80 text-white font-medium px-5 py-2.5 rounded-md transition"
        >
          Start your first project
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {projects.map((p) => (
        <button
          key={p.id}
          onClick={() => onOpen(p.id)}
          className="text-left bg-panel border border-white/10 rounded-lg p-4 hover:border-accent/50 transition"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-100">{p.title}</h3>
            <span className="text-xs uppercase tracking-wide text-gray-500">{p.input_mode}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(p.created_at).toLocaleDateString()}
          </p>
        </button>
      ))}
    </div>
  );
}
