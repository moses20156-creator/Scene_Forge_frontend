import { supabase } from "./supabase";
import type { Scene, PexelsPhoto } from "./types";

async function invoke<T>(fnName: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) {
    // Supabase's error object doesn't always include the function's own error
    // message body, so try to surface it if present.
    const details = (error as any)?.context?.body ?? error.message;
    throw new Error(typeof details === "string" ? details : JSON.stringify(details));
  }
  if (data?.error) throw new Error(data.error);
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
