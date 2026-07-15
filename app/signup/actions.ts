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

export const initialSignupState: SignupState = {
  status: "idle",
  message: "",
};

const signupSuccessMessage =
  "Account created. Check your email and confirm your account before logging in.";

const genericSignupError =
  "Unable to create your account right now. Please check your details and try again.";

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

async function getCurrentOrigin() {
  const requestHeaders = await headers();
  const origin = getFirstHeaderValue(requestHeaders.get("origin"));

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);

      if (parsedOrigin.protocol === "http:" || parsedOrigin.protocol === "https:") {
        return parsedOrigin.origin;
      }
    } catch {
      // Fall through to forwarded headers.
    }
  }

  const forwardedProto = getFirstHeaderValue(
    requestHeaders.get("x-forwarded-proto"),
  );
  const protocol = forwardedProto === "http" ? "http" : "https";
  const host =
    getSafeHost(requestHeaders.get("x-forwarded-host")) ||
    getSafeHost(requestHeaders.get("host"));

  if (!host) {
    throw new Error("Unable to determine application origin.");
  }

  return `${protocol}://${host}`;
}

export async function signup(
  _previousState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const { email, password, fieldErrors } = validateSignupForm(formData);

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
    const currentOrigin = await getCurrentOrigin();
    const confirmationDestination = new URL("/auth/confirm", currentOrigin);

    confirmationDestination.searchParams.set("next", "/dashboard");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: confirmationDestination.toString(),
      },
    });

    if (error) {
      console.error("Signup failed.", {
        code: error.code,
        message: error.message,
      });

      return {
        status: "error",
        message: genericSignupError,
        email,
      };
    }

    return {
      status: "success",
      message: signupSuccessMessage,
    };
  } catch (error) {
    console.error("Signup failed.", {
      message: error instanceof Error ? error.message : "Unknown signup error.",
    });

    return {
      status: "error",
      message: genericSignupError,
      email,
    };
  }
}
