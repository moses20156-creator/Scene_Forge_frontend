import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { renderScene } from "../lib/edgeFunctions";
import type { Scene } from "../lib/types";
import ShotRow from "./ShotRow";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-700 text-gray-300",
  shots_ready: "bg-blue-900 text-blue-300",
  rendering: "bg-yellow-900 text-yellow-300",
  rendered: "bg-green-900 text-green-300",
  failed: "bg-red-900 text-red-300",
};

export default function SceneCard({
  scene,
  onChanged,
}: {
  scene: Scene;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalDuration = scene.shots.reduce((sum, s) => sum + Number(s.duration_seconds), 0);
  const allImagesChosen = scene.shots
    .filter((s) => s.visual_type === "image")
    .every((s) => !!s.image_url);

  async function handleAudioUpload(file: File) {
    setUploadingAudio(true);
    try {
      const fileName = `scene-${scene.id}-${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("narration-audio")
        .upload(fileName, file, { upsert: true });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: publicUrlData } = supabase.storage.from("narration-audio").getPublicUrl(fileName);

      const { error: updateErr } = await supabase
        .from("scenes")
        .update({ narration_audio_url: publicUrlData.publicUrl })
        .eq("id", scene.id);
      if (updateErr) throw new Error(updateErr.message);

      onChanged();
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploadingAudio(false);
    }
  }

  async function handleRender() {
    setRendering(true);
    setRenderError(null);
    try {
      await renderScene(scene.id);
      onChanged();
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : String(err));
    } finally {
      setRendering(false);
    }
  }

  return (
    <div className="bg-panel border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <span className="text-gray-100 font-medium">
            Scene {scene.scene_number}
            {scene.scene_title ? ` — ${scene.scene_title}` : ""}
          </span>
          <span className="text-xs text-gray-500 ml-3">
            {scene.shots.length} shots · ~{Math.round(totalDuration)}s
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[scene.status]}`}>
          {scene.status.replace("_", " ")}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-4">
          <div className="space-y-3 mb-4">
            {scene.shots.map((shot) => (
              <ShotRow key={shot.id} shot={shot} onChanged={onChanged} />
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAudio}
              className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 px-3 py-2 rounded-md transition"
            >
              {uploadingAudio
                ? "Uploading…"
                : scene.narration_audio_url
                ? "Replace narration"
                : "Upload narration"}
            </button>

            {scene.narration_audio_url && (
              <audio src={scene.narration_audio_url} controls className="h-8" />
            )}

            <button
              onClick={handleRender}
              disabled={rendering || !allImagesChosen}
              className="ml-auto text-sm bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-md transition"
              title={!allImagesChosen ? "Pick images for every shot first" : ""}
            >
              {rendering ? "Rendering… (may take a minute)" : "Render Scene"}
            </button>
          </div>

          {renderError && (
            <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-md px-3 py-2 mt-3">
              {renderError}
            </div>
          )}

          {scene.video_url && (
            <video src={scene.video_url} controls className="w-full rounded-md mt-4" />
          )}
        </div>
      )}
    </div>
  );
}
