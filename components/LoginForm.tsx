"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initialLoginState: LoginState = {
  status: "idle",
  message: "",
};

function getFieldErrorId(fieldName: string, state: LoginState) {
  return state.fieldErrors?.[fieldName as keyof NonNullable<LoginState["fieldErrors"]>]
    ? `${fieldName}-error`
    : undefined;
}

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    login,
    initialLoginState,
  );
  const emailErrorId = getFieldErrorId("email", state);
  const passwordErrorId = getFieldErrorId("password", state);

  return (
    <section
      aria-labelledby="login-form-title"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2
          className="text-xl font-semibold text-slate-950"
          id="login-form-title"
        >
          Log in with email
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Enter the email and password you used when creating your account.
        </p>
      </div>

      <form action={formAction} className="mt-5 grid gap-4 sm:gap-5" noValidate>
        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="login-email"
          >
            Email
          </label>
          <input
            aria-describedby={emailErrorId}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            autoComplete="email"
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            defaultValue={state.email ?? ""}
            id="login-email"
            key={state.email ?? "login-email"}
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
            htmlFor="login-password"
          >
            Password
          </label>
          <input
            aria-describedby={passwordErrorId}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete="current-password"
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            id="login-password"
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

        {state.status === "error" && state.message ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium leading-6 text-red-800"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        <button
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:text-white"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          className="font-semibold text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          href="/signup"
        >
          Create one.
        </Link>
      </p>
    </section>
  );
}
