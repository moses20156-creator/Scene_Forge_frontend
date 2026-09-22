import { useState } from "react";
import { supabase } from "../lib/supabase";
import { searchPexels } from "../lib/edgeFunctions";
import type { Shot, PexelsPhoto, VisualType } from "../lib/types";

const TYPE_OPTIONS: { value: VisualType; label: string }[] = [
  { value: "image", label: "Photo" },
  { value: "text_card", label: "Text Card" },
  { value: "black", label: "Black" },
];

export default function ShotRow({ shot, onChanged }: { shot: Shot; onChanged: () => void }) {
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<PexelsPhoto[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [narration, setNarration] = useState(shot.narration_text);
  const [query, setQuery] = useState(shot.search_query ?? "");
  const [duration, setDuration] = useState(shot.duration_seconds);

  async function persist(patch: Record<string, unknown>) {
    await supabase.from("shots").update(patch).eq("id", shot.id);
    onChanged();
  }

  async function handleFindImage() {
    setSearching(true);
    setSearchError(null);
    try {
      // use whatever is currently in the query box, saving it first if changed
      if (query !== shot.search_query) await persist({ search_query: query });
      const result = await searchPexels({ query: query || shot.search_query || "" });
      setCandidates(result.photos);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  }

  async function handlePick(photo: PexelsPhoto) {
    await persist({ image_url: photo.url, pexels_photographer: photo.photographer });
    setCandidates(null);
  }

  async function handleDelete() {
    if (!window.confirm("Remove this shot?")) return;
    await supabase.from("shots").delete().eq("id", shot.id);
    onChanged();
  }

  return (
    <div className="bg-charcoal/60 border border-white/5 rounded-md p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
          Shot {shot.shot_number}
        </span>

        <div className="flex items-center gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => persist({ visual_type: opt.value })}
              className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded transition font-medium ${
                shot.visual_type === opt.value
                  ? "bg-accent text-white"
                  : "bg-white/5 text-gray-500 hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            onBlur={() => duration !== shot.duration_seconds && persist({ duration_seconds: duration })}
            className="w-16 bg-white/5 border border-white/10 rounded text-center text-xs text-gray-200 py-1 focus:outline-none focus:border-accent"
          />
          <span className="text-[10px] text-gray-600 uppercase">sec</span>
          <button onClick={handleDelete} title="Delete shot" className="text-gray-700 hover:text-red-400 transition ml-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
            </svg>
          </button>
        </div>
      </div>

      <textarea
        value={narration}
        onChange={(e) => setNarration(e.target.value)}
        onBlur={() => narration !== shot.narration_text && persist({ narration_text: narration })}
        rows={2}
        className="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 mb-2 text-sm text-gray-200 focus:outline-none focus:border-accent resize-none"
      />

      {shot.visual_type === "image" && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => query !== shot.search_query && persist({ search_query: query })}
              placeholder="Pexels search query…"
              className="flex-1 bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleFindImage}
              disabled={searching}
              className="shrink-0 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-md transition whitespace-nowrap"
            >
              {searching ? "Searching…" : "Find Image"}
            </button>
          </div>

          {shot.image_url && !candidates && (
            <div className="flex items-center gap-2">
              <img src={shot.image_url} alt="" className="w-24 h-16 object-cover rounded-md" />
              <span className="text-[10px] uppercase tracking-wide text-accent font-semibold">Picked</span>
              <button
                onClick={() => persist({ image_url: null, pexels_photographer: null })}
                className="text-[10px] text-gray-600 hover:text-gray-400 underline"
              >
                Clear
              </button>
            </div>
          )}

          {searchError && <p className="text-xs text-red-400 mb-2">{searchError}</p>}

          {candidates && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {candidates.map((photo) => (
                <button key={photo.id} onClick={() => handlePick(photo)} className="group relative">
                  <img
                    src={photo.thumbnail}
                    alt=""
                    className="w-full h-20 object-cover rounded-md border-2 border-transparent group-hover:border-accent transition"
                  />
                  <span className="block text-[9px] text-gray-600 mt-1 truncate">{photo.photographer}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {shot.visual_type === "text_card" && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={shot.card_text ?? ""}
            onChange={(e) => persist({ card_text: e.target.value })}
            placeholder="Main text (e.g. $1.75 BILLION)"
            className="bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-accent"
          />
          <input
            value={shot.card_subtext ?? ""}
            onChange={(e) => persist({ card_subtext: e.target.value })}
            placeholder="Subtext (optional)"
            className="bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-sm text-gray-400 focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {shot.visual_type === "black" && (
        <div className="bg-black rounded-md px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-widest">
          Black hold
        </div>
      )}
    </div>
  );
}
