"use client";

import { useActionState } from "react";
import {
  resendConfirmation,
  type ResendConfirmationState,
} from "@/app/login/resend-actions";

export default function ResendConfirmationForm() {
  const initialState: ResendConfirmationState = {
    status: "idle",
    message: "",
    email: "",
    fieldErrors: {},
  };
  const [state, formAction, isPending] = useActionState(
    resendConfirmation,
    initialState,
  );
  const emailErrorId = state.fieldErrors.email
    ? "resend-confirmation-email-error"
    : undefined;

  return (
    <form
      action={formAction}
      aria-label="Resend confirmation email"
      className="mt-4 grid gap-4"
      noValidate
    >
      <div>
        <label
          className="block text-sm font-semibold text-slate-700"
          htmlFor="resend-confirmation-email"
        >
          Email
        </label>
        <input
          aria-describedby={emailErrorId}
          aria-invalid={Boolean(state.fieldErrors.email)}
          autoComplete="email"
          className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
          defaultValue={state.email}
          id="resend-confirmation-email"
          key={state.email || "resend-confirmation-email"}
          name="email"
          placeholder="you@example.com"
          type="email"
        />
        {state.fieldErrors.email ? (
          <p
            className="mt-2 text-sm font-medium text-red-700"
            id="resend-confirmation-email-error"
            role="alert"
          >
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      {state.status === "error" && state.message ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium leading-6 text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "success" && state.message ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium leading-6 text-emerald-800"
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:text-white"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending..." : "Resend confirmation email"}
      </button>
    </form>
  );
}
