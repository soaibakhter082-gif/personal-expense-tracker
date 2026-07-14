import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL is required.",
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
