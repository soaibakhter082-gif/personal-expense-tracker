import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const defaultNextPath = "/dashboard";
const confirmationFailedPath = "/signup?error=confirmation-failed";

function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath) {
    return defaultNextPath;
  }

  const trimmedNextPath = nextPath.trim();

  if (
    trimmedNextPath !== nextPath ||
    !trimmedNextPath.startsWith("/") ||
    trimmedNextPath.startsWith("//") ||
    trimmedNextPath.includes("\\") ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmedNextPath)
  ) {
    return defaultNextPath;
  }

  return trimmedNextPath;
}

function createRedirectUrl(request: NextRequest, path: string) {
  const redirectUrl = new URL(path, request.url);

  redirectUrl.searchParams.delete("token_hash");
  redirectUrl.searchParams.delete("type");

  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
  const failureRedirectUrl = createRedirectUrl(request, confirmationFailedPath);

  if (!tokenHash || !type) {
    return NextResponse.redirect(failureRedirectUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  if (error) {
    console.error("Email confirmation failed.", {
      code: error.code,
      message: error.message,
    });

    return NextResponse.redirect(failureRedirectUrl);
  }

  return NextResponse.redirect(createRedirectUrl(request, nextPath));
}
