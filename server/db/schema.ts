
import { Generated } from 'kysely';

export interface TransactionsTable {
  id: Generated<number>;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO 8601 format
}

export interface Database {
  transactions: TransactionsTable;
}
