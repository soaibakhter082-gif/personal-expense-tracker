"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  initialSignupState,
  signup,
  type SignupState,
} from "@/app/signup/actions";

function getFieldErrorId(fieldName: string, state: SignupState) {
  return state.fieldErrors?.[fieldName as keyof NonNullable<SignupState["fieldErrors"]>]
    ? `${fieldName}-error`
    : undefined;
}

export default function SignupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    signup,
    initialSignupState,
  );
  const emailErrorId = getFieldErrorId("email", state);
  const passwordErrorId = getFieldErrorId("password", state);
  const confirmPasswordErrorId = getFieldErrorId("confirmPassword", state);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section
      aria-labelledby="signup-form-title"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2
          className="text-xl font-semibold text-slate-950"
          id="signup-form-title"
        >
          Sign up with email
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Use an email address you can access so you can confirm your account.
        </p>
      </div>

      <form
        action={formAction}
        className="mt-5 grid gap-4 sm:gap-5"
        noValidate
        ref={formRef}
      >
        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="signup-email"
          >
            Email
          </label>
          <input
            aria-describedby={emailErrorId}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            autoComplete="email"
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            defaultValue={state.status === "error" ? state.email : ""}
            id="signup-email"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
          {state.fieldErrors?.email ? (
            <p
              className="mt-2 text-sm font-medium text-red-700"
              id="email-error"
              role="alert"
            >
              {state.fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="signup-password"
          >
            Password
          </label>
          <input
            aria-describedby={passwordErrorId}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete="new-password"
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            id="signup-password"
            name="password"
            type="password"
          />
          {state.fieldErrors?.password ? (
            <p
              className="mt-2 text-sm font-medium text-red-700"
              id="password-error"
              role="alert"
            >
              {state.fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="signup-confirm-password"
          >
            Confirm Password
          </label>
          <input
            aria-describedby={confirmPasswordErrorId}
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            autoComplete="new-password"
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            id="signup-confirm-password"
            name="confirmPassword"
            type="password"
          />
          {state.fieldErrors?.confirmPassword ? (
            <p
              className="mt-2 text-sm font-medium text-red-700"
              id="confirmPassword-error"
              role="alert"
            >
              {state.fieldErrors.confirmPassword}
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
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:text-white"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </section>
  );
}
