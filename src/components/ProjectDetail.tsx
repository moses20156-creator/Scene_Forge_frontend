import { useEffect, useState, useCallback, useRef } from "react";
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
  const pollRef = useRef<number | null>(null);

  const loadAll = useCallback(async () => {
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

  // Poll while anything is actively rendering/assembling — rendering now happens
  // in the background on the render service, so the UI needs to check back
  // rather than wait on a single request.
  const anyRendering = scenes.some((s) => s.status === "rendering");
  useEffect(() => {
    if (anyRendering || assembling) {
      pollRef.current = window.setInterval(loadAll, 4000);
    } else if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [anyRendering, assembling, loadAll]);

  const allRendered = scenes.length > 0 && scenes.every((s) => s.status === "rendered");

  async function handleAssemble() {
    setAssembling(true);
    setAssembleError(null);
    try {
      await assembleVideo(projectId);
      // final_videos gets written by the render service in the background —
      // the poll effect above will pick it up once it appears.
    } catch (err) {
      setAssembleError(err instanceof Error ? err.message : String(err));
      setAssembling(false);
    }
  }

  // stop the "assembling" spinner once a final video actually shows up
  useEffect(() => {
    if (finalVideo) setAssembling(false);
  }, [finalVideo]);

  if (loading) return <p className="text-gray-500 text-sm">Loading case file…</p>;
  if (!project) return <p className="text-red-400">Case not found.</p>;

  return (
    <div>
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-300 mb-6 transition">
        ← All cases
      </button>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">Case File</p>
          <h2 className="text-2xl font-bold text-gray-100 leading-tight">{project.title}</h2>
          <p className="text-sm text-gray-500 mt-2">
            {scenes.length} scene{scenes.length !== 1 ? "s" : ""} ·{" "}
            {scenes.filter((s) => s.status === "rendered").length} ready to render
          </p>
        </div>

        <button
          onClick={handleAssemble}
          disabled={!allRendered || assembling}
          className="shrink-0 flex items-center gap-2 bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-md transition whitespace-nowrap"
          title={!allRendered ? "Render every scene first" : ""}
        >
          {assembling ? "Assembling…" : "Assemble Final Video"}
        </button>
      </div>

      {!allRendered && (
        <p className="text-xs text-gray-600 mb-6 -mt-4">
          Every scene must be rendered before the final cut can be stitched.
        </p>
      )}

      {assembleError && (
        <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-md px-3 py-2 mb-6">
          {assembleError}
        </div>
      )}

      {finalVideo && (
        <div className="bg-panel border border-accent/40 rounded-lg p-4 mb-8">
          <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">Final Cut Ready</p>
          <video src={finalVideo.video_url} controls className="w-full rounded-md mb-3" />
          <a
            href={finalVideo.video_url}
            download
            className="inline-block text-sm text-accent hover:underline font-medium"
          >
            Download MP4 ↓
          </a>
        </div>
      )}

      <div className="space-y-3">
        {scenes.map((scene) => (
          <SceneCard key={scene.id} scene={scene} onChanged={loadAll} />
        ))}
      </div>
    </div>
  );
}
