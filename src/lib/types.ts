export type InputMode = "auto" | "manual" | "structured";
export type SceneStatus = "pending" | "shots_ready" | "rendering" | "rendered" | "failed";
export type VisualType = "image" | "text_card" | "black";

export interface Project {
  id: string;
  title: string;
  raw_script: string;
  input_mode: InputMode;
  created_at: string;
}

export interface Shot {
  id: string;
  scene_id: string;
  shot_number: number;
  narration_text: string;
  duration_seconds: number;
  visual_type: VisualType;
  search_query: string | null;
  image_url: string | null;
  pexels_photographer: string | null;
  card_text: string | null;
  card_subtext: string | null;
}

export interface Scene {
  id: string;
  project_id: string;
  scene_number: number;
  scene_title: string | null;
  narration_audio_url: string | null;
  video_url: string | null;
  status: SceneStatus;
  error_message: string | null;
  shots: Shot[];
}

export interface FinalVideo {
  id: string;
  project_id: string;
  video_url: string;
  created_at: string;
}

export interface PexelsPhoto {
  id: number;
  url: string;
  thumbnail: string;
  photographer: string;
  pexels_page_url: string;
}
