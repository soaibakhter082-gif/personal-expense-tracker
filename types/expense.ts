export type Expense = {
  id: number;
  user_id: string;
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
