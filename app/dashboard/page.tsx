import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ExpenseTracker from "@/components/ExpenseTracker";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Personal Expense Tracker Dashboard",
  description: "Manage your private expenses and spending summaries",
};

function getVerifiedUserId(claims: unknown) {
  if (!claims || typeof claims !== "object" || !("sub" in claims)) {
    return null;
  }

  return typeof claims.sub === "string" && claims.sub.trim().length > 0
    ? claims.sub
    : null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = getVerifiedUserId(data?.claims);

  if (error || !userId) {
    redirect("/login?error=session-required");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
        <header className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
                Expense Dashboard
              </p>
              <div className="mt-3 max-w-3xl">
                <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
                  Personal Expense Tracker
                </h1>
                <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
                  Record daily spending and understand where your money goes
                  with clear summaries for totals, monthly expenses, and
                  categories.
                </p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </header>

        <ExpenseTracker userId={userId} />
      </div>
    </main>
  );
}
