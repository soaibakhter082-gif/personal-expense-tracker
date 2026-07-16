import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function hasValidSubject(claims: unknown) {
  if (!claims || typeof claims !== "object" || !("sub" in claims)) {
    return false;
  }

  return typeof claims.sub === "string" && claims.sub.trim().length > 0;
}

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && hasValidSubject(data?.claims)) {
    redirect("/dashboard");
  }

  redirect("/login");
}
