"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  buildConfirmationRedirectUrl,
  getCanonicalSiteOrigin,
} from "@/lib/siteUrl";

export type ResendConfirmationState = {
  status: "idle" | "success" | "error";
  message: string;
  email: string;
  fieldErrors: {
    email?: string;
  };
};

const successMessage =
  "If an unconfirmed account exists for this email, a new confirmation message has been sent.";

type ResendStage =
  | "validate-email"
  | "create-supabase-client"
  | "read-request-headers"
  | "build-redirect-url"
  | "call-resend";

function getFormValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function isReasonableEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validateEmail(formData: FormData) {
  const email = getFormValue(formData, "email").trim().toLowerCase();

  if (!email) {
    return {
      email,
      fieldError: "Email is required.",
    };
  }

  if (!isReasonableEmail(email)) {
    return {
      email,
      fieldError: "Enter a valid email address.",
    };
  }

  return {
    email,
    fieldError: undefined,
  };
}

function getShortMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message.length > 180 ? `${message.slice(0, 180)}...` : message;
}

function logResendDiagnostic(
  stage: ResendStage,
  error: {
    name?: string;
    code?: string;
    status?: number;
    message?: string;
  },
) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[resend-confirmation] Supabase resend diagnostic", {
      stage,
      name: error.name,
      code: error.code,
      status: error.status,
      message: getShortMessage(error.message),
    });
  }
}

function getExceptionDetails(error: unknown): {
  name?: string;
  message?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: "Unknown resend confirmation error.",
  };
}

function isAccountAbsenceError(code: string | undefined) {
  return (
    code === "user_not_found" ||
    code === "email_not_found" ||
    code === "user_not_found_for_email"
  );
}

function getResendErrorMessage(code: string | undefined) {
  switch (code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many confirmation requests. Wait a few minutes and try again.";
    case "email_address_invalid":
    case "validation_failed":
      return "Enter a valid email address.";
    case "email_provider_disabled":
    case "signup_disabled":
      return "Email confirmation is currently unavailable.";
    default:
      return "Unable to resend the confirmation email right now. Please try again.";
  }
}

export async function resendConfirmation(
  _previousState: ResendConfirmationState,
  formData: FormData,
): Promise<ResendConfirmationState> {
  let stage: ResendStage = "validate-email";
  const { email, fieldError } = validateEmail(formData);

  if (fieldError) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      email,
      fieldErrors: {
        email: fieldError,
      },
    };
  }

  try {
    stage = "create-supabase-client";
    const supabase = await createClient();
    stage = "read-request-headers";
    const requestHeaders = await headers();
    stage = "build-redirect-url";
    const emailRedirectTo = buildConfirmationRedirectUrl(
      getCanonicalSiteOrigin(requestHeaders),
    );

    stage = "call-resend";
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      logResendDiagnostic(stage, error);

      if (isAccountAbsenceError(error.code)) {
        return {
          status: "success",
          message: successMessage,
          email,
          fieldErrors: {},
        };
      }

      return {
        status: "error",
        message: getResendErrorMessage(error.code),
        email,
        fieldErrors: {},
      };
    }

    return {
      status: "success",
      message: successMessage,
      email,
      fieldErrors: {},
    };
  } catch (error) {
    logResendDiagnostic(stage, getExceptionDetails(error));

    return {
      status: "error",
      message: "Unable to resend the confirmation email right now. Please try again.",
      email,
      fieldErrors: {},
    };
  }
}
