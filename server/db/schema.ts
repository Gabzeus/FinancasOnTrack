
import { Generated } from 'kysely';

export interface TransactionsTable {
  id: Generated<number>;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO 8601 format
}

export interface CreditCardsTable {
  id: Generated<number>;
  name: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
}

export interface Database {
  transactions: TransactionsTable;
  credit_cards: CreditCardsTable;
}
