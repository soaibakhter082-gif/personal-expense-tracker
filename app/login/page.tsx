import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthNotice from "@/components/AuthNotice";
import LoginForm from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Log in | Personal Expense Tracker",
  description: "Log in to the Personal Expense Tracker.",
};

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

type LoginNotice = {
  variant: "success" | "error" | "info";
  message: string;
};

function getSingleParamValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function getLoginNotice(params: Awaited<SearchParams>): LoginNotice {
  const error = getSingleParamValue(params.error);
  const message = getSingleParamValue(params.message);

  if (error === "session-required") {
    return {
      variant: "info",
      message: "Please log in to continue.",
    };
  }

  if (error === "session-expired") {
    return {
      variant: "error",
      message: "Your session expired. Log in again to continue.",
    };
  }

  if (message === "signed-out") {
    return {
      variant: "success",
      message: "You have been logged out successfully.",
    };
  }

  return {
    variant: "info",
    message: "",
  };
}

function hasValidSubject(claims: unknown) {
  if (!claims || typeof claims !== "object" || !("sub" in claims)) {
    return false;
  }

  return typeof claims.sub === "string" && claims.sub.trim().length > 0;
}

async function isAuthenticated() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    return !error && hasValidSubject(data?.claims);
  } catch {
    return false;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  const notice = getLoginNotice(await searchParams);

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
        <header className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
            Expense Tracker Account
          </p>
          <div className="mt-3 max-w-2xl">
            <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
              Log in to view and manage your private expenses.
            </p>
          </div>
        </header>

        <AuthNotice message={notice.message} variant={notice.variant} />

        <LoginForm />
      </div>
    </main>
  );
}
