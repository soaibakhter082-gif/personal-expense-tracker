"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type SignupFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export type SignupState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: SignupFieldErrors;
  email?: string;
};

const signupSuccessMessage =
  "Account created. Check your email and confirm your account before logging in.";

const genericSignupError =
  "Unable to create your account. Please try again.";

const authEmailServiceError =
  "Account creation failed because the authentication email service encountered a server problem. Check the Supabase Auth and SMTP logs.";

const maybeExistingAccountMessage =
  "An account may already exist for this email. Try logging in or use another email.";

type SignupStage =
  | "create-supabase-client"
  | "read-request-headers"
  | "build-redirect-url"
  | "call-sign-up"
  | "validate-sign-up-result";

function getFormValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function isReasonableEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validateSignupForm(formData: FormData) {
  const email = getFormValue(formData, "email").trim().toLowerCase();
  const password = getFormValue(formData, "password");
  const confirmPassword = getFormValue(formData, "confirmPassword");
  const fieldErrors: SignupFieldErrors = {};

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!isReasonableEmail(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Password is required.";
  } else if (password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Password confirmation is required.";
  } else if (password && password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords must match.";
  }

  return {
    email,
    password,
    fieldErrors,
  };
}

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

function getSafeHost(value: string | null) {
  const host = getFirstHeaderValue(value);

  if (
    !host ||
    host.includes("/") ||
    host.includes("\\") ||
    !/^(?:[a-z0-9-]+\.)*[a-z0-9-]+(?::\d{1,5})?$/i.test(host)
  ) {
    return "";
  }

  return host;
}

function getProtocol(host: string, forwardedProto: string) {
  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  return /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(host)
    ? "http"
    : "https";
}

function getCurrentOrigin(requestHeaders: Headers) {
  const host =
    getSafeHost(requestHeaders.get("x-forwarded-host")) ||
    getSafeHost(requestHeaders.get("host"));

  if (!host) {
    throw new Error("Unable to determine application origin.");
  }

  const protocol = getProtocol(
    host,
    getFirstHeaderValue(requestHeaders.get("x-forwarded-proto")),
  );

  return `${protocol}://${host}`;
}

function isAuthEmailServiceFailure(
  code: string | undefined,
  status: number | undefined,
  message: string | undefined,
) {
  return (
    code === "unexpected_failure" ||
    status === 500 ||
    /email delivery|smtp|send email|send mail|mail service/i.test(message ?? "")
  );
}

function getSignupErrorMessage(
  code: string | undefined,
  status?: number,
  message?: string,
) {
  if (isAuthEmailServiceFailure(code, status, message)) {
    return authEmailServiceError;
  }

  switch (code) {
    case "signup_disabled":
    case "email_provider_disabled":
      return "New account registration is currently unavailable. Check the Supabase email signup settings.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many signup attempts. Wait a few minutes and try again.";
    case "weak_password":
      return "Choose a stronger password and try again.";
    case "email_address_invalid":
    case "validation_failed":
      return "Enter a valid email address.";
    case "email_address_not_authorized":
      return "The confirmation email could not be sent to this address. Check the SMTP configuration.";
    case "email_exists":
    case "user_already_exists":
      return maybeExistingAccountMessage;
    default:
      return genericSignupError;
  }
}

function getShortMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message.length > 180 ? `${message.slice(0, 180)}...` : message;
}

function logSignUpError(
  stage: SignupStage,
  error: {
    name?: string;
    code?: string;
    status?: number;
    message?: string;
  },
) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[signup] Supabase signUp returned an error", {
      stage,
      name: error.name,
      code: error.code,
      status: error.status,
      message: getShortMessage(error.message),
    });
  }
}

function logUnexpectedException(
  stage: SignupStage,
  error: {
    name?: string;
    message?: string;
  },
) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[signup] Unexpected exception", {
      stage,
      name: error.name,
      message: getShortMessage(error.message),
    });
  }
}

function logNoUserReturned() {
  if (process.env.NODE_ENV !== "production") {
    console.error("[signup] No user returned", {
      stage: "validate-sign-up-result",
    });
  }
}

function logEmptyIdentitiesReturned() {
  if (process.env.NODE_ENV !== "production") {
    console.error("[signup] Empty identities returned", {
      stage: "validate-sign-up-result",
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
    message: "Unknown signup error.",
  };
}

export async function signup(
  _previousState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const { email, password, fieldErrors } = validateSignupForm(formData);
  let stage: SignupStage = "create-supabase-client";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      email,
    };
  }

  try {
    const supabase = await createClient();
    stage = "read-request-headers";
    const requestHeaders = await headers();
    stage = "build-redirect-url";
    const currentOrigin = getCurrentOrigin(requestHeaders);
    const confirmationDestination = new URL(
      "/auth/confirm?next=/dashboard",
      currentOrigin,
    );
    const emailRedirectTo = confirmationDestination.toString();

    stage = "call-sign-up";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      logSignUpError(stage, error);

      return {
        status: "error",
        message: getSignupErrorMessage(
          error.code,
          error.status,
          error.message,
        ),
        email,
      };
    }

    stage = "validate-sign-up-result";

    if (!data.user) {
      logNoUserReturned();

      return {
        status: "error",
        message: genericSignupError,
        email,
      };
    }

    if (
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      logEmptyIdentitiesReturned();

      return {
        status: "error",
        message: maybeExistingAccountMessage,
        email,
      };
    }

    return {
      status: "success",
      message: signupSuccessMessage,
      email,
    };
  } catch (error) {
    logUnexpectedException(stage, getExceptionDetails(error));

    return {
      status: "error",
      message: genericSignupError,
      email,
    };
  }
}
