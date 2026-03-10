import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://volhuxrekdjwzhtjxndn.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_KNO4fIfCrIy8RHwN5q2vtw_AdL_AC_3";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
