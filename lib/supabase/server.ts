import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseConfig() {
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

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

function isServerComponentCookieWriteError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes(
    "Cookies can only be modified in a Server Action or Route Handler",
  );
}

export async function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          if (!isServerComponentCookieWriteError(error)) {
            throw error;
          }
        }
      },
    },
  });
}
