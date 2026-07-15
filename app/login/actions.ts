"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export type LoginState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: LoginFieldErrors;
  email?: string;
};

function getFormValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function isReasonableEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validateLoginForm(formData: FormData) {
  const email = getFormValue(formData, "email").trim().toLowerCase();
  const password = getFormValue(formData, "password");
  const fieldErrors: LoginFieldErrors = {};

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!isReasonableEmail(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Password is required.";
  }

  return {
    email,
    password,
    fieldErrors,
  };
}

function isUnconfirmedEmailError(error: { code?: string; message: string }) {
  const message = error.message.toLowerCase();

  return (
    error.code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("not confirmed")
  );
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const { email, password, fieldErrors } = validateLoginForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      email,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login failed.", {
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: isUnconfirmedEmailError(error)
        ? "Confirm your email address before logging in."
        : "Email or password is incorrect.",
      email,
    };
  }

  redirect("/dashboard");
}
