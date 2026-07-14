import type { Expense } from "@/types/expense";

type ExpenseListProps = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  editingId: number | null;
  deletingId: number | null;
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

export default function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  editingId,
  deletingId,
}: ExpenseListProps) {
  return (
    <ul className="mt-6 grid gap-3 sm:gap-4">
      {expenses.map((expense) => (
        <li
          className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 transition sm:p-5"
          key={expense.id}
        >
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="break-words text-xl font-semibold leading-tight text-slate-950">
                {currencyFormatter.format(expense.amount)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="max-w-full break-words rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
                  {expense.category}
                </span>
                <span className="px-0 py-1 font-medium">
                  {formatExpenseDate(expense.expense_date)}
                </span>
              </div>
              {expense.note ? (
                <p className="mt-3 break-words rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                  {expense.note}
                </p>
              ) : null}
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-none sm:grid-flow-col">
              <button
                aria-label={`Edit ${currencyFormatter.format(expense.amount)} ${expense.category} expense from ${formatExpenseDate(expense.expense_date)}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
                disabled={editingId === expense.id}
                onClick={() => onEdit(expense)}
                type="button"
              >
                {editingId === expense.id ? "Editing" : "Edit"}
              </button>

              <button
                aria-label={`Delete ${currencyFormatter.format(expense.amount)} ${expense.category} expense from ${formatExpenseDate(expense.expense_date)}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-red-100 disabled:bg-red-50 disabled:text-red-300 sm:w-auto"
                disabled={deletingId === expense.id}
                onClick={() => onDelete(expense.id)}
                type="button"
              >
                {deletingId === expense.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
