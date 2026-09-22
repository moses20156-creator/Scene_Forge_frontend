import { supabase } from "./supabase";
import type { Scene, PexelsPhoto } from "./types";

async function invoke<T>(fnName: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) {
    let message = error.message || `${fnName} failed with no error message`;
    const ctx = (error as any)?.context;
    if (ctx && typeof ctx.clone === "function") {
      try {
        const parsed = await ctx.clone().json();
        if (parsed?.error) message = parsed.error;
      } catch {
        try {
          const text = await ctx.clone().text();
          if (text) message = text;
        } catch {
          // no readable body at all — fall back to error.message above
        }
      }
    }
    throw new Error(`[${fnName}] ${message}`);
  }
  if (data?.error) throw new Error(`[${fnName}] ${data.error}`);
  return data as T;
}

export function parseScriptAuto(project_id: string, raw_script: string) {
  return invoke<{ scenes: Scene[] }>("parse-script-auto", { project_id, raw_script });
}

export function parseScriptStructured(project_id: string, raw_script: string) {
  return invoke<{ scenes: Scene[] }>("parse-script-structured", { project_id, raw_script });
}

export function searchPexels(args: { shot_id?: string; query?: string }) {
  return invoke<{ query: string; photos: PexelsPhoto[] }>("search-pexels", args);
}

export function renderScene(scene_id: string) {
  return invoke<{ scene_id: string; video_url: string }>("render-scene", { scene_id });
}

export function assembleVideo(project_id: string) {
  return invoke<{ project_id: string; video_url: string }>("assemble-video", { project_id });
}
