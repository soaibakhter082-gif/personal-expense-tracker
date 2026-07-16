"use client";

import { useActionState } from "react";
import { logout, type LogoutState } from "@/app/dashboard/actions";

export default function LogoutButton() {
  const initialLogoutState: LogoutState = {
    status: "idle",
    message: "",
  };
  const [state, formAction, isPending] = useActionState(
    logout,
    initialLogoutState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-2 sm:w-auto">
      <button
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Logging out..." : "Log Out"}
      </button>

      {state.status === "error" && state.message ? (
        <p
          className="max-w-56 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium leading-6 text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
