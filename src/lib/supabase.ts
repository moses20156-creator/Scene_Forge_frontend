import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ipgbzhvcvygbyxvmesev.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ2J6aHZjdnlnYnl4dm1lc2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTU3NTEsImV4cCI6MjEwNTQ5MTc1MX0.YmL5OXigIR7yUarxZl10DIYhZJLG87kksA5nxv2BJLE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
