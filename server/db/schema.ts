
import { Generated } from 'kysely';

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  created_at: Generated<string>;
}

export interface TransactionsTable {
  id: Generated<number>;
  user_id: number;
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
  user_id: number;
  name: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
}

export interface GoalsTable {
  id: Generated<number>;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null; // ISO 8601 format
}

export interface RecurringTransactionsTable {
    id: Generated<number>;
    user_id: number;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date: string; // ISO 8601 format
    end_date: string | null; // ISO 8601 format
    credit_card_id: number | null;
}

export interface SettingsTable {
  user_id: number;
  key: string;
  value: string;
}

export interface Database {
  users: UsersTable;
  transactions: TransactionsTable;
  credit_cards: CreditCardsTable;
  goals: GoalsTable;
  recurring_transactions: RecurringTransactionsTable;
  settings: SettingsTable;
}
