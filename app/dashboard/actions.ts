"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LogoutState = {
  status: "idle" | "error";
  message: string;
};

export async function logout(
  _previousState: LogoutState,
  _formData: FormData,
): Promise<LogoutState> {
  void _previousState;
  void _formData;

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout failed.", {
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: "Unable to log out. Please try again.",
    };
  }

  redirect("/login?message=signed-out");
}
