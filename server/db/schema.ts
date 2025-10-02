
import { Generated } from 'kysely';

export interface TransactionsTable {
  id: Generated<number>;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO 8601 format
  credit_card_id: number | null;
  goal_id: number | null;
}

export interface CreditCardsTable {
  id: Generated<number>;
  name: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
}

export interface BudgetsTable {
  id: Generated<number>;
  category: string;
  amount: number;
  month: string; // YYYY-MM format
}

export interface GoalsTable {
  id: Generated<number>;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null; // ISO 8601 format
}

export interface RecurringTransactionsTable {
    id: Generated<number>;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date: string; // ISO 8601 format
    end_date: string | null; // ISO 8601 format
    credit_card_id: number | null;
}

export interface Database {
  transactions: TransactionsTable;
  credit_cards: CreditCardsTable;
  budgets: BudgetsTable;
  goals: GoalsTable;
  recurring_transactions: RecurringTransactionsTable;
}
