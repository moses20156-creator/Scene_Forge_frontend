import { useState } from "react";
import { supabase } from "../lib/supabase";
import { searchPexels } from "../lib/edgeFunctions";
import type { Shot, PexelsPhoto } from "../lib/types";

export default function ShotRow({ shot, onChanged }: { shot: Shot; onChanged: () => void }) {
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<PexelsPhoto[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleFindImage() {
    setSearching(true);
    setSearchError(null);
    try {
      const result = await searchPexels({ shot_id: shot.id });
      setCandidates(result.photos);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  }

  async function handlePick(photo: PexelsPhoto) {
    const { error } = await supabase
      .from("shots")
      .update({ image_url: photo.url, pexels_photographer: photo.photographer })
      .eq("id", shot.id);
    if (!error) {
      setCandidates(null);
      onChanged();
    }
  }

  return (
    <div className="bg-charcoal/60 border border-white/5 rounded-md p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm text-gray-200 flex-1">
          <span className="text-gray-600 mr-2">#{shot.shot_number}</span>
          {shot.narration_text}
        </p>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {shot.duration_seconds}s · {shot.visual_type}
        </span>
      </div>

      {shot.visual_type === "image" && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Query: "{shot.search_query}"</span>
            <button
              onClick={handleFindImage}
              disabled={searching}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-2 py-1 rounded transition"
            >
              {searching ? "Searching…" : shot.image_url ? "Change image" : "Find Image"}
            </button>
          </div>

          {shot.image_url && !candidates && (
            <img src={shot.image_url} alt="" className="w-40 h-24 object-cover rounded-md" />
          )}

          {searchError && <p className="text-xs text-red-400 mb-2">{searchError}</p>}

          {candidates && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {candidates.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => handlePick(photo)}
                  className="group relative"
                >
                  <img
                    src={photo.thumbnail}
                    alt=""
                    className="w-full h-20 object-cover rounded-md border-2 border-transparent group-hover:border-accent transition"
                  />
                  <span className="block text-[10px] text-gray-500 mt-1 truncate">
                    {photo.photographer}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {shot.visual_type === "text_card" && (
        <div className="bg-black/40 rounded-md px-3 py-2 text-center">
          <p className="text-gray-100 font-semibold">{shot.card_text}</p>
          {shot.card_subtext && <p className="text-gray-500 text-xs mt-1">{shot.card_subtext}</p>}
        </div>
      )}

      {shot.visual_type === "black" && (
        <div className="bg-black rounded-md px-3 py-2 text-center text-xs text-gray-600">
          Black hold
        </div>
      )}
    </div>
  );
}
