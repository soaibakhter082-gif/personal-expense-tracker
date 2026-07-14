"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Expense, ExpenseInput } from "@/types/expense";

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Health",
  "Education",
  "Other",
];

type FormValues = {
  amount: string;
  category: string;
  expense_date: string;
  note: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

type ExpenseRow = Omit<Expense, "amount"> & {
  amount: number | string | null;
};

type ExpenseFormProps = {
  editingExpense: Expense | null;
  onExpenseCreated: (expense: Expense) => void;
  onExpenseUpdated: (expense: Expense) => void;
  onCancelEdit: () => void;
};

const initialFormValues: FormValues = {
  amount: "",
  category: "",
  expense_date: "",
  note: "",
};

const savedFormValues: FormValues = {
  amount: "",
  category: "Food",
  expense_date: "",
  note: "",
};

function validateForm(values: FormValues) {
  const errors: FieldErrors = {};
  const trimmedAmount = values.amount.trim();
  const amount = Number(trimmedAmount);

  if (!trimmedAmount) {
    errors.amount = "Amount is required.";
  } else if (Number.isNaN(amount)) {
    errors.amount = "Amount must be a valid number.";
  } else if (amount <= 0) {
    errors.amount = "Amount must be greater than zero.";
  }

  if (!values.category) {
    errors.category = "Category is required.";
  }

  if (!values.expense_date) {
    errors.expense_date = "Expense date is required.";
  }

  return errors;
}

function buildExpenseInput(values: FormValues): ExpenseInput {
  const trimmedNote = values.note.trim();

  return {
    amount: Number(values.amount.trim()),
    category: values.category,
    expense_date: values.expense_date,
    note: trimmedNote || null,
  };
}

function normalizeExpense(row: ExpenseRow): Expense {
  const amount = Number(row.amount);

  return {
    ...row,
    amount: Number.isFinite(amount) ? amount : 0,
  };
}

export default function ExpenseForm({
  editingExpense,
  onExpenseCreated,
  onExpenseUpdated,
  onCancelEdit,
}: ExpenseFormProps) {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [databaseError, setDatabaseError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = editingExpense !== null;

  useEffect(() => {
    if (!editingExpense) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFormValues({
        amount: String(editingExpense.amount),
        category: editingExpense.category,
        expense_date: editingExpense.expense_date,
        note: editingExpense.note ?? "",
      });
      setErrors({});
      setStatusMessage("");
      setDatabaseError("");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [editingExpense]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
    setStatusMessage("");
    setDatabaseError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateForm(formValues);
    setErrors(validationErrors);
    setDatabaseError("");
    setStatusMessage("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const expenseInput: ExpenseInput = buildExpenseInput(formValues);

    setIsSubmitting(true);

    if (isEditing) {
      setStatusMessage("Updating expense...");

      const { data, error } = await supabase
        .from("expenses")
        .update(expenseInput)
        .eq("id", editingExpense.id)
        .select("id, amount, category, expense_date, note, created_at")
        .single();

      if (error) {
        console.error("Unable to update expense.", {
          code: error.code,
          message: error.message,
        });
        setDatabaseError("Unable to update the expense. Please try again.");
        setStatusMessage("");
        setIsSubmitting(false);
        return;
      }

      const updatedExpense = normalizeExpense(data as ExpenseRow);
      onExpenseUpdated(updatedExpense);
      setFormValues(savedFormValues);
      setErrors({});
      setDatabaseError("");
      setStatusMessage("Expense updated successfully.");
      setIsSubmitting(false);
      return;
    }

    setStatusMessage("Saving expense...");

    const { data, error } = await supabase
      .from("expenses")
      .insert(expenseInput)
      .select("id, amount, category, expense_date, note, created_at")
      .single();

    if (error || !data) {
      console.error("Unable to save expense.", {
        code: error?.code,
        message: error?.message ?? "No created row was returned.",
      });
      setDatabaseError("Unable to save the expense. Please try again.");
      setStatusMessage("");
      setIsSubmitting(false);
      return;
    }

    const createdExpense = normalizeExpense(data as ExpenseRow);
    onExpenseCreated(createdExpense);
    setFormValues(savedFormValues);
    setErrors({});
    setDatabaseError("");
    setStatusMessage("Expense saved successfully.");
    setIsSubmitting(false);
  }

  function handleCancelEdit() {
    onCancelEdit();
    setFormValues(initialFormValues);
    setErrors({});
    setStatusMessage("");
    setDatabaseError("");
  }

  return (
    <section
      aria-labelledby="expense-form-title"
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2
          className="text-xl font-semibold text-slate-950"
          id="expense-form-title"
        >
          {isEditing ? "Edit Expense" : "Add Expense"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEditing
            ? "Update the selected expense details."
            : "Enter the spending details you want to track."}
        </p>
      </div>

      <form className="mt-5 grid gap-4 sm:gap-5" noValidate onSubmit={handleSubmit}>
        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="amount"
          >
            Amount
          </label>
          <input
            aria-describedby={errors.amount ? "amount-error" : undefined}
            aria-invalid={Boolean(errors.amount)}
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            id="amount"
            inputMode="decimal"
            min="0"
            name="amount"
            onChange={handleChange}
            placeholder="₹0.00"
            type="number"
            value={formValues.amount}
          />
          {errors.amount ? (
            <p
              className="mt-2 text-sm font-medium text-red-700"
              id="amount-error"
              role="alert"
            >
              {errors.amount}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="category"
          >
            Category
          </label>
          <select
            aria-describedby={errors.category ? "category-error" : undefined}
            aria-invalid={Boolean(errors.category)}
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            id="category"
            name="category"
            onChange={handleChange}
            value={formValues.category}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p
              className="mt-2 text-sm font-medium text-red-700"
              id="category-error"
              role="alert"
            >
              {errors.category}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="expense-date"
          >
            Expense Date
          </label>
          <input
            aria-describedby={
              errors.expense_date ? "expense-date-error" : undefined
            }
            aria-invalid={Boolean(errors.expense_date)}
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            id="expense-date"
            name="expense_date"
            onChange={handleChange}
            type="date"
            value={formValues.expense_date}
          />
          {errors.expense_date ? (
            <p
              className="mt-2 text-sm font-medium text-red-700"
              id="expense-date-error"
              role="alert"
            >
              {errors.expense_date}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="note"
          >
            Note
          </label>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
            id="note"
            name="note"
            onChange={handleChange}
            placeholder="Optional details about this expense"
            value={formValues.note}
          />
        </div>

        {statusMessage ? (
          <p
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium leading-6 text-emerald-800"
            role="status"
          >
            {statusMessage}
          </p>
        ) : null}

        {databaseError ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium leading-6 text-red-800"
            role="alert"
          >
            {databaseError}
          </p>
        ) : null}

        <button
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:text-white"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Saving..."
            : isEditing
              ? "Update Expense"
              : "Add Expense"}
        </button>

        {isEditing ? (
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            onClick={handleCancelEdit}
            type="button"
          >
            Cancel Edit
          </button>
        ) : null}
      </form>
    </section>
  );
}
