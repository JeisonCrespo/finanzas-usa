export type TransactionType = 'expense' | 'income' | 'transfer';

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash';

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface BankAccount {
  id: string;
  name: string;
  institution: string;
  mask?: string;
  type: AccountType;
  balance: number;
  currency: string;
  includeInTotal: boolean;
  isPlaidConnected: boolean;
  plaidAccountId?: string;
  plaidItemId?: string;
  color: string;
  lastSyncedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  isCustom: boolean;
  monthlyBudget?: number; // Presupuesto mensual opcional ($ USD), si es 0 o undefined no tiene tope
}

export interface Transaction {
  id: string;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  description: string;
  merchantName?: string;
  date: string; // YYYY-MM-DD
  isFromPlaid: boolean;
  plaidTransactionId?: string;
  recurringId?: string;
}

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId: string;
  accountId: string;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  postponedUntil?: string;
  active: boolean;
  notes?: string;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
  count: number;
  monthlyBudget?: number;
}
