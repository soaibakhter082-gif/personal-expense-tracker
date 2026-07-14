import type { Expense } from "@/types/expense";

type ExpenseSummaryProps = {
  expenses: Expense[];
};

type CategoryTotal = {
  category: string;
  total: number;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function toSafeAmount(amount: number) {
  return Number.isFinite(amount) ? amount : 0;
}

function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getCategoryTotals(expenses: Expense[]) {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const category = expense.category.trim();

    if (!category) {
      continue;
    }

    totals.set(
      category,
      (totals.get(category) ?? 0) + toSafeAmount(expense.amount),
    );
  }

  return Array.from(totals, ([category, total]): CategoryTotal => ({
    category,
    total,
  })).sort((firstCategory, secondCategory) => {
    const totalDifference = secondCategory.total - firstCategory.total;

    if (totalDifference !== 0) {
      return totalDifference;
    }

    return firstCategory.category.localeCompare(secondCategory.category);
  });
}

export default function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const currentYearMonth = getCurrentYearMonth();
  const totalExpenses = expenses.reduce(
    (total, expense) => total + toSafeAmount(expense.amount),
    0,
  );
  const currentMonthTotal = expenses.reduce((total, expense) => {
    if (expense.expense_date.slice(0, 7) !== currentYearMonth) {
      return total;
    }

    return total + toSafeAmount(expense.amount);
  }, 0);
  const categoryTotals = getCategoryTotals(expenses);
  const activeCategoryCount = categoryTotals.length;
  const summaryCards = [
    {
      label: "Total Expenses",
      value: currencyFormatter.format(totalExpenses),
    },
    {
      label: "This Month",
      value: currencyFormatter.format(currentMonthTotal),
    },
    {
      label: "Categories",
      value: String(activeCategoryCount),
    },
  ];

  return (
    <section aria-labelledby="expense-summary-title" className="grid gap-4 sm:gap-5">
      <div>
        <h2
          className="text-xl font-semibold text-slate-950"
          id="expense-summary-title"
        >
          Spending Summary
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Totals update from the expenses currently loaded on this page.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            key={card.label}
          >
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className="mt-3 break-words text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <section
        aria-labelledby="category-summary-title"
        className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="border-b border-slate-200 pb-4">
          <h3
            className="text-lg font-semibold text-slate-950"
            id="category-summary-title"
          >
            Category Totals
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Category totals are grouped from saved expenses.
          </p>
        </div>

        {categoryTotals.length > 0 ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categoryTotals.map((categoryTotal) => (
              <li
                className="flex min-w-0 flex-col gap-1 rounded-lg bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                key={categoryTotal.category}
              >
                <span className="min-w-0 break-words text-sm font-semibold text-slate-700 [overflow-wrap:anywhere]">
                  {categoryTotal.category}
                </span>
                <span className="shrink-0 break-words text-sm font-semibold text-slate-950">
                  {currencyFormatter.format(categoryTotal.total)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Add expenses to see category totals.
          </p>
        )}
      </section>
    </section>
  );
}
