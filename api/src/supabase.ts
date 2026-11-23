import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const BUCKET = "products";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any> | undefined;
export const supabase = () =>
  (client ??= createClient(env().SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  }));

export const imageUrl = (path: string | null) =>
  path ? supabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;
