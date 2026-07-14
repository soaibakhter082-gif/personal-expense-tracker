export type Expense = {
  id: number;
  amount: number;
  category: string;
  expense_date: string;
  note: string | null;
  created_at: string;
};

export type ExpenseInput = {
  amount: number;
  category: string;
  expense_date: string;
  note: string | null;
};
