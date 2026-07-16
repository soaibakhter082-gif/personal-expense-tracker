import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const defaultNextPath = "/dashboard";
const confirmationFailedPath = "/signup?error=confirmation-failed";
const confirmedLoginPath = "/login?message=email-confirmed";
const allowedConfirmationTypes = new Set<EmailOtpType>(["email", "signup"]);

type ConfirmationStage =
  | "read-confirmation-params"
  | "validate-confirmation-type"
  | "create-server-client"
  | "verify-otp"
  | "validate-confirmed-user"
  | "validate-confirmation-session"
  | "redirect-after-confirmation";

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

function isAllowedConfirmationType(type: string | null): type is EmailOtpType {
  return type !== null && allowedConfirmationTypes.has(type as EmailOtpType);
}

function hasValidUserId(user: { id?: string } | null) {
  return typeof user?.id === "string" && user.id.trim().length > 0;
}

function hasUsableSession(session: { access_token?: string } | null) {
  return (
    typeof session?.access_token === "string" &&
    session.access_token.trim().length > 0
  );
}

function hasValidSubject(claims: unknown) {
  if (!claims || typeof claims !== "object" || !("sub" in claims)) {
    return false;
  }

  return typeof claims.sub === "string" && claims.sub.trim().length > 0;
}

function getShortMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message.length > 180 ? `${message.slice(0, 180)}...` : message;
}

function logConfirmationDiagnostic(
  stage: ConfirmationStage,
  details: {
    name?: string;
    code?: string;
    status?: number;
    message?: string;
  } = {},
) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[auth-confirm] Confirmation diagnostic", {
      stage,
      name: details.name,
      code: details.code,
      status: details.status,
      message: getShortMessage(details.message),
    });
  }
}

export async function GET(request: NextRequest) {
  let stage: ConfirmationStage = "read-confirmation-params";
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
  const failureRedirectUrl = createRedirectUrl(request, confirmationFailedPath);
  const confirmedLoginUrl = createRedirectUrl(request, confirmedLoginPath);

  stage = "validate-confirmation-type";
  if (!tokenHash || !isAllowedConfirmationType(type)) {
    logConfirmationDiagnostic(stage, {
      code: !tokenHash ? "missing_token_hash" : "unsupported_type",
    });

    return NextResponse.redirect(failureRedirectUrl);
  }

  stage = "create-server-client";
  const supabase = await createClient();
  stage = "verify-otp";
  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    logConfirmationDiagnostic(stage, {
      name: error.name,
      code: error.code,
      status: error.status,
      message: error.message,
    });

    return NextResponse.redirect(failureRedirectUrl);
  }

  stage = "validate-confirmed-user";
  if (!hasValidUserId(data.user)) {
    logConfirmationDiagnostic(stage, {
      code: "missing_confirmed_user",
      message: "verifyOtp did not return a confirmed user.",
    });

    return NextResponse.redirect(failureRedirectUrl);
  }

  stage = "validate-confirmation-session";
  if (!hasUsableSession(data.session)) {
    logConfirmationDiagnostic(stage, {
      code: "missing_confirmation_session",
      message: "verifyOtp confirmed the user without returning a session.",
    });

    return NextResponse.redirect(confirmedLoginUrl);
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !hasValidSubject(claimsData?.claims)) {
    logConfirmationDiagnostic(stage, {
      name: claimsError?.name,
      code: claimsError?.code ?? "missing_confirmation_claims",
      status: claimsError?.status,
      message:
        claimsError?.message ??
        "verifyOtp returned a session, but authenticated claims were not usable.",
    });

    return NextResponse.redirect(confirmedLoginUrl);
  }

  stage = "redirect-after-confirmation";
  return NextResponse.redirect(createRedirectUrl(request, nextPath));
}
