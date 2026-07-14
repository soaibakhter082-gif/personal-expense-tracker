import type { Expense } from "@/types/expense";

type ExpenseListProps = {
  expenses: Expense[];
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatExpenseDate(expenseDate: string) {
  const date = new Date(`${expenseDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return expenseDate;
  }

  return dateFormatter.format(date);
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
  return (
    <ul className="mt-6 grid gap-3">
      {expenses.map((expense) => (
        <li
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          key={expense.id}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-950">
                {currencyFormatter.format(expense.amount)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                  {expense.category}
                </span>
                <span className="px-0 py-1">
                  {formatExpenseDate(expense.expense_date)}
                </span>
              </div>
              {expense.note ? (
                <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                  {expense.note}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
