import ExpenseTracker from "@/components/ExpenseTracker";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Expense Dashboard
          </p>
          <div className="mt-3 max-w-3xl">
            <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
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
