import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthNotice from "@/components/AuthNotice";
import SignupForm from "@/components/SignupForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create your account | Personal Expense Tracker",
  description: "Create an account for the Personal Expense Tracker.",
};

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function getSingleParamValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function getSignupErrorMessage(params: Awaited<SearchParams>) {
  const error = getSingleParamValue(params.error);

  if (error === "confirmation-failed") {
    return "The account link is invalid or expired. Try signing up again, or log in if your account already exists.";
  }

  return "";
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

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  const errorMessage = getSignupErrorMessage(await searchParams);

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
        <header className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
            Expense Tracker Account
          </p>
          <div className="mt-3 max-w-2xl">
            <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Create your account
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
              Create an account to keep your expenses private.
            </p>
          </div>
        </header>

        <AuthNotice message={errorMessage} variant="error" />

        <SignupForm />

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            className="font-semibold text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            href="/login"
          >
            Log in.
          </Link>
        </p>
      </div>
    </main>
  );
}
