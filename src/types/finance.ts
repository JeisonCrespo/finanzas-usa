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
  // Campos exclusivos para control de Tarjetas de Crédito en EE. UU.
  creditLimit?: number; // Límite total de la tarjeta ($ USD)
  closingDay?: number; // Día de corte (Statement Closing Date, 1-31)
  dueDay?: number; // Día límite de pago (Payment Due Date, 1-31)
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  isCustom: boolean;
}

export interface MonthlyBudgetItem {
  id: string;
  title: string; // Ej. "Comida del mes", "Salidas", "Juegos Steam"
  limitAmount: number; // Ej. 200.00
  categoryId?: string; // Opcional: si se vincula a una categoría suma automático, más manualSpent
  manualSpent: number; // Monto manual adicional o directo
  color: string;
  icon: string;
}

export interface SavingsGoal {
  id: string;
  title: string; // Ej. "Fondo de Emergencia", "PC Gamer", "Viaje"
  targetAmount: number;
  savedAmount: number;
  color: string;
  icon: string;
  deadline?: string;
}

export type LoanDirection = 'lent' | 'borrowed'; // 'lent' = Presté (Me deben) | 'borrowed' = Pedí prestado (Yo debo)

export interface LoanRecord {
  id: string;
  personName: string;
  direction: LoanDirection;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  date: string;
  dueDate?: string;
  isSettled: boolean;
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
}
