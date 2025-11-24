
import { Generated } from 'kysely';

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  created_at: Generated<string>;
  role: 'admin' | 'user';
  license_status: 'active' | 'inactive' | 'expired';
  license_expiry_date: string | null;
  password_reset_token: string | null;
  password_reset_expires: string | null;
  whatsapp_number: string | null;
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

export interface CategoryFeedbackTable {
  id: Generated<number>;
  user_id: number;
  original_description: string;
  user_provided_category: string;
  ai_suggested_category: string | null;
  timestamp: Generated<string>;
}

export interface SpendingLimitsTable {
  id: Generated<number>;
  user_id: number;
  category: string;
  limit_amount: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface WhatsappReportsTable {
  id: Generated<number>;
  user_id: number;
  report_type: 'daily' | 'weekly' | 'monthly' | 'alert';
  sent_at: Generated<string>;
  message_content: string;
}

export interface Database {
  users: UsersTable;
  transactions: TransactionsTable;
  credit_cards: CreditCardsTable;
  goals: GoalsTable;
  recurring_transactions: RecurringTransactionsTable;
  settings: SettingsTable;
  category_feedback: CategoryFeedbackTable;
  spending_limits: SpendingLimitsTable;
  whatsapp_reports: WhatsappReportsTable;
}
