import ExpenseTracker from "@/components/ExpenseTracker";

const summaryCards = [
  {
    label: "Total Expenses",
    value: "₹0",
  },
  {
    label: "This Month",
    value: "₹0",
  },
  {
    label: "Categories",
    value: "0",
  },
];

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

        <section
          aria-label="Expense summaries"
          className="grid gap-4 sm:grid-cols-3"
        >
          {summaryCards.map((card) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={card.label}
            >
              <p className="text-sm font-medium text-slate-500">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <ExpenseTracker />
      </div>
    </main>
  );
}
