
import { Generated } from 'kysely';

export interface TransactionsTable {
  id: Generated<number>;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO 8601 format
  credit_card_id: number | null;
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

export interface Database {
  transactions: TransactionsTable;
  credit_cards: CreditCardsTable;
  budgets: BudgetsTable;
}
