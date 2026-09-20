import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { assembleVideo } from "../lib/edgeFunctions";
import type { Project, Scene, FinalVideo } from "../lib/types";
import SceneCard from "./SceneCard";

export default function ProjectDetail({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [finalVideo, setFinalVideo] = useState<FinalVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [assembling, setAssembling] = useState(false);
  const [assembleError, setAssembleError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: proj }, { data: sceneRows }, { data: finals }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("scenes")
        .select("*, shots(*)")
        .eq("project_id", projectId)
        .order("scene_number", { ascending: true }),
      supabase
        .from("final_videos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    setProject(proj as Project);
    setScenes(
      ((sceneRows as any[]) ?? []).map((s) => ({
        ...s,
        shots: (s.shots ?? []).sort((a: any, b: any) => a.shot_number - b.shot_number),
      })) as Scene[]
    );
    setFinalVideo(finals && finals.length > 0 ? (finals[0] as FinalVideo) : null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const allRendered = scenes.length > 0 && scenes.every((s) => s.status === "rendered");

  async function handleAssemble() {
    setAssembling(true);
    setAssembleError(null);
    try {
      await assembleVideo(projectId);
      await loadAll();
    } catch (err) {
      setAssembleError(err instanceof Error ? err.message : String(err));
    } finally {
      setAssembling(false);
    }
  }

  if (loading) return <p className="text-gray-400">Loading…</p>;
  if (!project) return <p className="text-red-400">Project not found.</p>;

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-300 mb-4">
        ← All projects
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">{project.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {scenes.length} scene{scenes.length !== 1 ? "s" : ""} · {project.input_mode} mode
          </p>
        </div>

        <button
          onClick={handleAssemble}
          disabled={!allRendered || assembling}
          className="bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-md transition whitespace-nowrap"
          title={!allRendered ? "Render every scene first" : ""}
        >
          {assembling ? "Assembling…" : "Assemble Final Video"}
        </button>
      </div>

      {assembleError && (
        <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-md px-3 py-2 mb-6">
          {assembleError}
        </div>
      )}

      {finalVideo && (
        <div className="bg-panel border border-accent/40 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300 mb-2">Final video ready:</p>
          <video src={finalVideo.video_url} controls className="w-full rounded-md mb-3" />
          <a
            href={finalVideo.video_url}
            download
            className="inline-block text-sm text-accent hover:underline"
          >
            Download MP4
          </a>
        </div>
      )}

      <div className="space-y-4">
        {scenes.map((scene) => (
          <SceneCard key={scene.id} scene={scene} onChanged={loadAll} />
        ))}
      </div>
    </div>
  );
}
