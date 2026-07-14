"use client";

import { useEffect, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ExpenseSummary from "@/components/ExpenseSummary";
import { supabase } from "@/lib/supabaseClient";
import type { Expense } from "@/types/expense";

type ExpenseRow = Omit<Expense, "amount"> & {
  amount: number | string | null;
};

function normalizeExpense(row: ExpenseRow): Expense {
  const amount = Number(row.amount);

  return {
    ...row,
    amount: Number.isFinite(amount) ? amount : 0,
  };
}

function sortExpenses(expenses: Expense[]) {
  return [...expenses].sort((firstExpense, secondExpense) => {
    const dateComparison = secondExpense.expense_date.localeCompare(
      firstExpense.expense_date,
    );

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return secondExpense.created_at.localeCompare(firstExpense.created_at);
  });
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadExpenses() {
      setIsLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("expenses")
        .select("id, amount, category, expense_date, note, created_at")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Unable to load expenses.", {
          code: error.code,
          message: error.message,
        });
        setExpenses([]);
        setErrorMessage("Unable to load expenses. Please try again.");
        setIsLoading(false);
        return;
      }

      setExpenses(((data ?? []) as ExpenseRow[]).map(normalizeExpense));
      setIsLoading(false);
    }

    loadExpenses();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleDeleteExpense(id: number) {
    if (deletingId === id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setDeleteError(null);

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) {
        console.error("Unable to delete expense.", {
          code: error.code,
          message: error.message,
        });
        setDeleteError("Unable to delete the expense. Please try again.");
        return;
      }

      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== id),
      );
      setDeleteError(null);
    } finally {
      setDeletingId(null);
    }
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
  }

  function handleExpenseCreated(createdExpense: Expense) {
    setExpenses((currentExpenses) =>
      sortExpenses([
        createdExpense,
        ...currentExpenses.filter((expense) => expense.id !== createdExpense.id),
      ]),
    );
  }

  function handleExpenseUpdated(updatedExpense: Expense) {
    setExpenses((currentExpenses) =>
      currentExpenses.map((expense) =>
        expense.id === updatedExpense.id ? updatedExpense : expense,
      ),
    );
    setEditingExpense(null);
  }

  function handleCancelEdit() {
    setEditingExpense(null);
  }

  return (
    <div className="grid gap-6">
      <ExpenseSummary expenses={expenses} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <ExpenseForm
          editingExpense={editingExpense}
          onCancelEdit={handleCancelEdit}
          onExpenseCreated={handleExpenseCreated}
          onExpenseUpdated={handleExpenseUpdated}
        />

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

          {isLoading ? (
            <p
              className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-600"
              role="status"
            >
              Loading expenses...
            </p>
          ) : null}

          {!isLoading && errorMessage ? (
            <p
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm font-medium text-red-800"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          {!isLoading && !errorMessage && expenses.length === 0 ? (
            <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
              <p className="text-base font-semibold text-slate-800">
                No expenses added yet.
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Your saved expenses will appear here.
              </p>
            </div>
          ) : null}

          {!isLoading && !errorMessage && expenses.length > 0 ? (
            <>
              {deleteError ? (
                <p
                  className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                  role="alert"
                >
                  {deleteError}
                </p>
              ) : null}

              <ExpenseList
                deletingId={deletingId}
                editingId={editingExpense?.id ?? null}
                expenses={expenses}
                onDelete={handleDeleteExpense}
                onEdit={handleEditExpense}
              />
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
