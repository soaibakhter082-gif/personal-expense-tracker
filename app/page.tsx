import ExpenseTracker from "@/components/ExpenseTracker";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
        <header className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
            Expense Dashboard
          </p>
          <div className="mt-3 max-w-3xl">
            <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Personal Expense Tracker
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
              Record daily spending and understand where your money goes with
              clear summaries for totals, monthly expenses, and categories.
            </p>
          </div>
        </header>

        <ExpenseTracker />
      </div>
    </main>
  );
}
