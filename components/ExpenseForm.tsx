"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { ExpenseInput } from "@/types/expense";

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

const initialFormValues: FormValues = {
  amount: "",
  category: "",
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

export default function ExpenseForm() {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");

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
    setMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(formValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setMessage("");
      return;
    }

    buildExpenseInput(formValues);
    setMessage("Form is valid. Database saving will be added in the next step.");
  }

  return (
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

      <form className="mt-5 grid gap-4" noValidate onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="amount">
            Amount
          </label>
          <input
            aria-describedby={errors.amount ? "amount-error" : undefined}
            aria-invalid={Boolean(errors.amount)}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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
            className="text-sm font-medium text-slate-700"
            htmlFor="category"
          >
            Category
          </label>
          <select
            aria-describedby={errors.category ? "category-error" : undefined}
            aria-invalid={Boolean(errors.category)}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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
            className="text-sm font-medium text-slate-700"
            htmlFor="expense-date"
          >
            Expense Date
          </label>
          <input
            aria-describedby={
              errors.expense_date ? "expense-date-error" : undefined
            }
            aria-invalid={Boolean(errors.expense_date)}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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
          <label className="text-sm font-medium text-slate-700" htmlFor="note">
            Note
          </label>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            id="note"
            name="note"
            onChange={handleChange}
            placeholder="Optional details about this expense"
            value={formValues.note}
          />
        </div>

        {message ? (
          <p
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
            role="status"
          >
            {message}
          </p>
        ) : null}

        <button
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          type="submit"
        >
          Add Expense
        </button>
      </form>
    </section>
  );
}
