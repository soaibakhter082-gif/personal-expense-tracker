const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Health",
  "Education",
  "Other",
];

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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
          <section
            aria-labelledby="expense-form-title"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="border-b border-slate-200 pb-4">
              <h2
                className="text-xl font-semibold text-slate-950"
                id="expense-form-title"
              >
                Add Expense
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the spending details you want to track.
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="amount"
                >
                  Amount
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  id="amount"
                  inputMode="decimal"
                  min="0"
                  name="amount"
                  placeholder="₹0.00"
                  type="number"
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="category"
                >
                  Category
                </label>
                <select
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  id="category"
                  name="category"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="expense-date"
                >
                  Expense Date
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  id="expense-date"
                  name="expense_date"
                  type="date"
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="note"
                >
                  Note
                </label>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  id="note"
                  name="note"
                  placeholder="Optional details about this expense"
                />
              </div>

              <button
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                type="button"
              >
                Add Expense
              </button>
            </div>
          </section>

          <section
            aria-labelledby="expenses-title"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="text-xl font-semibold text-slate-950"
                  id="expenses-title"
                >
                  Expenses
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Recent expense records will be listed here.
                </p>
              </div>
            </div>

            <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
              <p className="text-base font-semibold text-slate-800">
                No expenses added yet.
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Your saved expenses will appear here.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
