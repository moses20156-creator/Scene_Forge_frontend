import { useState } from "react";
import { supabase } from "../lib/supabase";
import { parseScriptAuto, parseScriptStructured } from "../lib/edgeFunctions";
import type { InputMode } from "../lib/types";

export default function NewProjectForm({
  onCreated,
  onCancel,
}: {
  onCreated: (projectId: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [mode, setMode] = useState<InputMode>("structured");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!script.trim()) {
      setError("Paste a script first.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const { data: project, error: insertErr } = await supabase
        .from("projects")
        .insert({
          title: title.trim() || "Untitled Project",
          raw_script: script,
          input_mode: mode,
        })
        .select()
        .single();

      if (insertErr) throw new Error(insertErr.message);

      if (mode === "auto") {
        await parseScriptAuto(project.id, script);
      } else if (mode === "structured") {
        await parseScriptStructured(project.id, script);
      }
      // "manual" mode: scenes/shots get created by the user in the detail view,
      // nothing to call here.

      onCreated(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-6 text-gray-100">New Project</h2>

      <label className="block text-sm text-gray-400 mb-1">Project title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Quibi — The $1.75B App That Died"
        className="w-full bg-panel border border-white/10 rounded-md px-3 py-2 mb-4 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-accent"
      />

      <label className="block text-sm text-gray-400 mb-1">Script</label>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        rows={14}
        placeholder="Paste your script here…"
        className="w-full bg-panel border border-white/10 rounded-md px-3 py-2 mb-4 text-gray-100 placeholder:text-gray-600 font-mono text-sm focus:outline-none focus:border-accent"
      />

      <label className="block text-sm text-gray-400 mb-2">Input mode</label>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <ModeOption
          selected={mode === "structured"}
          onClick={() => setMode("structured")}
          title="Parse structured script"
          desc="Script already has SCENE/TIME/VOICEOVER/VISUALS sections — extract them directly."
        />
        <ModeOption
          selected={mode === "auto"}
          onClick={() => setMode("auto")}
          title="Auto-break into scenes"
          desc="Plain narration text — AI figures out the scene/shot breaks."
        />
        <ModeOption
          selected={mode === "manual"}
          onClick={() => setMode("manual")}
          title="I'll mark it myself"
          desc="Build scenes and shots by hand in the editor."
        />
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-md transition"
        >
          {busy ? "Processing…" : "Create Project"}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="text-gray-400 hover:text-gray-200 px-5 py-2.5 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ModeOption({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-md border p-3 transition ${
        selected ? "border-accent bg-accent/10" : "border-white/10 bg-panel hover:border-white/25"
      }`}
    >
      <div className="text-sm font-medium text-gray-100 mb-1">{title}</div>
      <div className="text-xs text-gray-500">{desc}</div>
    </button>
  );
}
