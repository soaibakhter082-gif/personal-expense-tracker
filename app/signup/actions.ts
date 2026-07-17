"use server";

import { redirect } from "next/navigation";
import { sendWelcomeEmail } from "@/lib/email/sendWelcomeEmail";
import { createClient } from "@/lib/supabase/server";

export type SignupFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export type SignupState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: SignupFieldErrors;
  email?: string;
};

const genericSignupError =
  "Unable to create your account. Please try again.";

const maybeExistingAccountMessage =
  "An account may already exist for this email. Try logging in or use another email.";

const missingSessionMessage =
  "Your account was created, but automatic sign-in is unavailable. Please check the authentication configuration and try again.";

type SignupStage =
  | "create-supabase-client"
  | "call-sign-up"
  | "validate-sign-up-result";

type SignupData = {
  user: { id?: string; identities?: unknown[] | null } | null;
  session: { access_token?: string; refresh_token?: string } | null;
};

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

function getSignupErrorMessage(code: string | undefined) {
  switch (code) {
    case "signup_disabled":
    case "email_provider_disabled":
      return "New account registration is currently unavailable.";
    case "over_request_rate_limit":
      return "Too many signup attempts. Wait a few minutes and try again.";
    case "weak_password":
      return "Choose a stronger password and try again.";
    case "email_address_invalid":
    case "validation_failed":
      return "Enter a valid email address.";
    case "email_exists":
    case "user_already_exists":
      return maybeExistingAccountMessage;
    default:
      return genericSignupError;
  }
}

function logSignUpError(
  stage: SignupStage,
  error: {
    name?: string;
    code?: string;
    status?: number;
  },
) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[signup] Supabase signUp returned an error", {
      stage,
      name: error.name,
      code: error.code,
      status: error.status,
    });
  }
}

function logUnexpectedException(
  stage: SignupStage,
  error: {
    name?: string;
  },
) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[signup] Unexpected exception", {
      stage,
      name: error.name,
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

function logNoSessionReturned() {
  if (process.env.NODE_ENV !== "production") {
    console.error("[signup] No session returned", {
      stage: "validate-sign-up-result",
      code: "missing_signup_session",
    });
  }
}

function getExceptionDetails(error: unknown): {
  name?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
    };
  }

  return {};
}

function hasValidUserId(user: { id?: string } | null) {
  return typeof user?.id === "string" && user.id.trim().length > 0;
}

function hasUsableSession(
  session: { access_token?: string; refresh_token?: string } | null,
) {
  return (
    typeof session?.access_token === "string" &&
    session.access_token.trim().length > 0 &&
    typeof session.refresh_token === "string" &&
    session.refresh_token.trim().length > 0
  );
}

export async function signup(
  _previousState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const { email, password, fieldErrors } = validateSignupForm(formData);
  let stage: SignupStage = "create-supabase-client";
  let signupData: SignupData | null = null;

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

    stage = "call-sign-up";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    signupData = data;

    if (error) {
      logSignUpError(stage, error);

      return {
        status: "error",
        message: getSignupErrorMessage(error.code),
        email,
      };
    }
  } catch (error) {
    logUnexpectedException(stage, getExceptionDetails(error));

    return {
      status: "error",
      message: genericSignupError,
      email,
    };
  }

  stage = "validate-sign-up-result";

  if (!hasValidUserId(signupData?.user ?? null)) {
    logNoUserReturned();

    return {
      status: "error",
      message: genericSignupError,
      email,
    };
  }

  if (
    Array.isArray(signupData?.user?.identities) &&
    signupData.user.identities.length === 0
  ) {
    logEmptyIdentitiesReturned();

    return {
      status: "error",
      message: maybeExistingAccountMessage,
      email,
    };
  }

  if (!hasUsableSession(signupData?.session ?? null)) {
    logNoSessionReturned();

    return {
      status: "error",
      message: missingSessionMessage,
      email,
    };
  }

  await sendWelcomeEmail(email);

  redirect("/dashboard");
}
