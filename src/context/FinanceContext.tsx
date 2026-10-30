import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  BankAccount,
  Category,
  CategoryBreakdown,
  LoanRecord,
  MonthlyBudgetItem,
  RecurringItem,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import {
  addDaysToDate,
  calculateNextCycleDate,
  getDb,
  seedDefaultCategoriesOnly,
} from '../db/database';
import { US_SANDBOX_BANKS, PLAID_BACKEND_URL } from '../services/plaidService';

export interface AppBackupPayload {
  version: number;
  exportedAt: string;
  accounts: BankAccount[];
  categories: Category[];
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  monthlyBudgets?: MonthlyBudgetItem[];
  savingsGoals?: SavingsGoal[];
  loans?: LoanRecord[];
}

export interface TransferParams {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fee?: number;
  description?: string;
  date: string;
}

interface FinanceContextType {
  loading: boolean;
  accounts: BankAccount[];
  categories: Category[];
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  monthlyBudgets: MonthlyBudgetItem[];
  savingsGoals: SavingsGoal[];
  loans: LoanRecord[];
  backendUrl: string;
  setBackendUrl: (url: string) => Promise<void>;
  includedTotalBalance: number;
  excludedTotalBalance: number;
  netWorthBalance: number;
  // Cuentas y Tarjetas de Crédito
  toggleAccountIncludeInTotal: (accountId: string) => Promise<void>;
  addManualAccount: (account: Omit<BankAccount, 'id' | 'isPlaidConnected'>) => Promise<void>;
  updateCreditCardDetails: (
    accountId: string,
    creditLimit: number,
    closingDay: number,
    dueDay: number
  ) => Promise<void>;
  connectSandboxUSBank: (bankPresetId: string, includeInTotal: boolean) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  // Categorías (Separadas en Ajustes)
  addCategory: (category: Omit<Category, 'id' | 'isCustom'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  // Presupuestos Mensuales (Apartado Independiente)
  addMonthlyBudget: (budget: Omit<MonthlyBudgetItem, 'id' | 'manualSpent'>) => Promise<void>;
  addManualSpendToBudget: (budgetId: string, extraAmount: number) => Promise<void>;
  deleteMonthlyBudget: (budgetId: string) => Promise<void>;
  getBudgetSpentAmount: (budget: MonthlyBudgetItem) => number;
  // Metas de Ahorro (Savings Goals)
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<void>;
  updateSavingsGoalAmount: (goalId: string, deltaAmount: number) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  // Préstamos y Deudas (Me deben / Yo debo)
  addLoanRecord: (loan: Omit<LoanRecord, 'id' | 'paidAmount' | 'isSettled'>) => Promise<void>;
  registerLoanPayment: (loanId: string, paymentAmount: number) => Promise<void>;
  deleteLoanRecord: (loanId: string) => Promise<void>;
  // Transacciones y Transferencias
  addTransaction: (tx: Omit<Transaction, 'id' | 'isFromPlaid'>) => Promise<void>;
  transferBetweenAccounts: (params: TransferParams) => Promise<void>;
  deleteTransaction: (txId: string) => Promise<void>;
  // Recurrentes
  addRecurringItem: (item: Omit<RecurringItem, 'id' | 'active'>) => Promise<void>;
  confirmRecurringItem: (recurringId: string, customAmount?: number, customFee?: number) => Promise<void>;
  postponeRecurringItem: (recurringId: string, daysToPostpone: number) => Promise<void>;
  skipRecurringCycle: (recurringId: string) => Promise<void>;
  deleteRecurringItem: (recurringId: string) => Promise<void>;
  // Gráficas
  getCategoryBreakdown: (type: 'expense' | 'income', accountFilterId?: string, yearMonthFilter?: string) => CategoryBreakdown[];
  // Respaldo y Reinicio
  resetToZero: () => Promise<void>;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudgetItem[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [backendUrl, setBackendUrlState] = useState<string>(PLAID_BACKEND_URL);

  const refreshAll = useCallback(async () => {
    try {
      const db = await getDb();

      await seedDefaultCategoriesOnly(db);

      const savedHost = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = 'backend_url'"
      );
      if (savedHost?.value) {
        setBackendUrlState(savedHost.value);
      }

      const rawAccounts = await db.getAllAsync<any>('SELECT * FROM accounts ORDER BY name ASC');
      setAccounts(
        rawAccounts.map((r) => ({
          id: r.id,
          name: r.name,
          institution: r.institution,
          mask: r.mask ?? undefined,
          type: r.type,
          balance: Number(r.balance),
          currency: r.currency,
          includeInTotal: Boolean(r.include_in_total),
          isPlaidConnected: Boolean(r.is_plaid_connected),
          plaidAccountId: r.plaid_account_id ?? undefined,
          plaidItemId: r.plaid_item_id ?? undefined,
          color: r.color,
          lastSyncedAt: r.last_synced_at ?? undefined,
          creditLimit: Number(r.credit_limit || 0),
          closingDay: Number(r.closing_day || 0),
          dueDay: Number(r.due_day || 0),
        }))
      );

      const rawCategories = await db.getAllAsync<any>('SELECT * FROM categories ORDER BY name ASC');
      setCategories(
        rawCategories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          color: c.color,
          icon: c.icon,
          isCustom: Boolean(c.is_custom),
        }))
      );

      const rawBudgets = await db.getAllAsync<any>('SELECT * FROM monthly_budgets ORDER BY rowid DESC');
      setMonthlyBudgets(
        rawBudgets.map((b) => ({
          id: b.id,
          title: b.title,
          limitAmount: Number(b.limit_amount),
          categoryId: b.category_id ?? undefined,
          manualSpent: Number(b.manual_spent || 0),
          color: b.color,
          icon: b.icon,
        }))
      );

      const rawGoals = await db.getAllAsync<any>('SELECT * FROM savings_goals ORDER BY rowid DESC');
      setSavingsGoals(
        rawGoals.map((g) => ({
          id: g.id,
          title: g.title,
          targetAmount: Number(g.target_amount),
          savedAmount: Number(g.saved_amount || 0),
          color: g.color,
          icon: g.icon,
          deadline: g.deadline ?? undefined,
        }))
      );

      const rawLoans = await db.getAllAsync<any>('SELECT * FROM loans ORDER BY is_settled ASC, rowid DESC');
      setLoans(
        rawLoans.map((l) => ({
          id: l.id,
          personName: l.person_name,
          direction: l.direction,
          totalAmount: Number(l.total_amount),
          paidAmount: Number(l.paid_amount || 0),
          notes: l.notes ?? undefined,
          date: l.date,
          dueDate: l.due_date ?? undefined,
          isSettled: Boolean(l.is_settled),
        }))
      );

      const rawTx = await db.getAllAsync<any>(
        'SELECT * FROM transactions ORDER BY date DESC, rowid DESC'
      );
      setTransactions(
        rawTx.map((t) => ({
          id: t.id,
          accountId: t.account_id,
          toAccountId: t.to_account_id ?? undefined,
          categoryId: t.category_id,
          type: t.type,
          amount: Number(t.amount),
          fee: Number(t.fee || 0),
          description: t.description,
          merchantName: t.merchant_name ?? undefined,
          date: t.date,
          isFromPlaid: Boolean(t.is_from_plaid),
          plaidTransactionId: t.plaid_transaction_id ?? undefined,
          recurringId: t.recurring_id ?? undefined,
        }))
      );

      const rawRec = await db.getAllAsync<any>(
        'SELECT * FROM recurring_items WHERE active = 1 ORDER BY next_due_date ASC'
      );
      setRecurringItems(
        rawRec.map((r) => ({
          id: r.id,
          title: r.title,
          amount: Number(r.amount),
          type: r.type,
          categoryId: r.category_id,
          accountId: r.account_id,
          frequency: r.frequency,
          nextDueDate: r.next_due_date,
          postponedUntil: r.postponed_until ?? undefined,
          active: Boolean(r.active),
          notes: r.notes ?? undefined,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const setBackendUrl = async (url: string) => {
    const clean = url.trim().replace(/\/+$/, '');
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('backend_url', ?)",
      [clean]
    );
    setBackendUrlState(clean);
  };

  const includedTotalBalance = useMemo(() => {
    return accounts
      .filter((a) => a.includeInTotal)
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const excludedTotalBalance = useMemo(() => {
    return accounts
      .filter((a) => !a.includeInTotal)
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const netWorthBalance = useMemo(() => {
    return includedTotalBalance + excludedTotalBalance;
  }, [includedTotalBalance, excludedTotalBalance]);

  const toggleAccountIncludeInTotal = async (accountId: string) => {
    const db = await getDb();
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;

    const newVal = target.includeInTotal ? 0 : 1;
    await db.runAsync('UPDATE accounts SET include_in_total = ? WHERE id = ?', [
      newVal,
      accountId,
    ]);
    await refreshAll();
  };

  const addManualAccount = async (account: Omit<BankAccount, 'id' | 'isPlaidConnected'>) => {
    const db = await getDb();
    const id = `acc-${Date.now()}`;
    await db.runAsync(
      `INSERT INTO accounts (
        id, name, institution, mask, type, balance, currency, include_in_total, is_plaid_connected, color,
        credit_limit, closing_day, due_day
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        id,
        account.name,
        account.institution,
        account.mask ?? null,
        account.type,
        account.balance,
        account.currency || 'USD',
        account.includeInTotal ? 1 : 0,
        account.color,
        account.creditLimit ?? 0,
        account.closingDay ?? 0,
        account.dueDay ?? 0,
      ]
    );
    await refreshAll();
  };

  const updateCreditCardDetails = async (
    accountId: string,
    creditLimit: number,
    closingDay: number,
    dueDay: number
  ) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE accounts SET credit_limit = ?, closing_day = ?, due_day = ? WHERE id = ?`,
      [creditLimit, closingDay, dueDay, accountId]
    );
    await refreshAll();
  };

  const connectSandboxUSBank = async (bankPresetId: string, includeInTotal: boolean) => {
    const preset = US_SANDBOX_BANKS.find((b) => b.id === bankPresetId);
    if (!preset) return;

    const db = await getDb();
    const accountId = `acc-plaid-${preset.id}-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    await db.runAsync(
      `INSERT INTO accounts (
        id, name, institution, mask, type, balance, currency,
        include_in_total, is_plaid_connected, plaid_account_id, color, last_synced_at,
        credit_limit, closing_day, due_day
      ) VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, 1, ?, ?, ?, ?, ?, ?)`,
      [
        accountId,
        preset.accountName,
        preset.institution,
        preset.mask,
        preset.type,
        Math.abs(preset.balance),
        includeInTotal ? 1 : 0,
        `plaid_${preset.id}`,
        preset.color,
        nowIso,
        preset.type === 'credit' ? 5000 : 0,
        preset.type === 'credit' ? 20 : 0,
        preset.type === 'credit' ? 15 : 0,
      ]
    );

    for (const sampleTx of preset.sampleTransactions) {
      const txId = `tx-plaid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await db.runAsync(
        `INSERT INTO transactions (
          id, account_id, category_id, type, amount, fee, description, merchant_name, date, is_from_plaid, plaid_transaction_id
        ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 1, ?)`,
        [
          txId,
          accountId,
          sampleTx.categoryId,
          sampleTx.type,
          sampleTx.amount,
          sampleTx.description,
          sampleTx.merchantName,
          today,
          txId,
        ]
      );
    }

    await refreshAll();
  };

  const deleteAccount = async (accountId: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM transactions WHERE account_id = ? OR to_account_id = ?', [
      accountId,
      accountId,
    ]);
    await db.runAsync('DELETE FROM recurring_items WHERE account_id = ?', [accountId]);
    await db.runAsync('DELETE FROM accounts WHERE id = ?', [accountId]);
    await refreshAll();
  };

  const addCategory = async (category: Omit<Category, 'id' | 'isCustom'>) => {
    const db = await getDb();
    const id = `cat-custom-${Date.now()}`;
    await db.runAsync(
      `INSERT INTO categories (id, name, type, color, icon, is_custom) VALUES (?, ?, ?, ?, ?, 1)`,
      [id, category.name.trim(), category.type, category.color, category.icon]
    );
    await refreshAll();
  };

  const deleteCategory = async (categoryId: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM categories WHERE id = ? AND is_custom = 1', [categoryId]);
    await refreshAll();
  };

  // --- PRESUPUESTOS MENSUALES (INDEPENDIENTES DE CATEGORÍAS) ---
  const addMonthlyBudget = async (budget: Omit<MonthlyBudgetItem, 'id' | 'manualSpent'>) => {
    const db = await getDb();
    const id = `budget-${Date.now()}`;
    await db.runAsync(
      `INSERT INTO monthly_budgets (id, title, limit_amount, category_id, manual_spent, color, icon)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        budget.title.trim(),
        budget.limitAmount,
        budget.categoryId || null,
        budget.color,
        budget.icon,
      ]
    );
    await refreshAll();
  };

  const addManualSpendToBudget = async (budgetId: string, extraAmount: number) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE monthly_budgets SET manual_spent = MAX(0, manual_spent + ?) WHERE id = ?`,
      [extraAmount, budgetId]
    );
    await refreshAll();
  };

  const deleteMonthlyBudget = async (budgetId: string) => {
    const db = await getDb();
    await db.runAsync(`DELETE FROM monthly_budgets WHERE id = ?`, [budgetId]);
    await refreshAll();
  };

  const getBudgetSpentAmount = useCallback(
    (budget: MonthlyBudgetItem): number => {
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      let catSpent = 0;
      if (budget.categoryId) {
        catSpent = transactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.categoryId === budget.categoryId &&
              t.date.startsWith(currentYearMonth)
          )
          .reduce((sum, t) => sum + t.amount, 0);
      }
      return catSpent + (budget.manualSpent || 0);
    },
    [transactions]
  );

  // --- METAS DE AHORRO (SAVINGS GOALS) ---
  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    const db = await getDb();
    const id = `goal-${Date.now()}`;
    await db.runAsync(
      `INSERT INTO savings_goals (id, title, target_amount, saved_amount, color, icon, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        goal.title.trim(),
        goal.targetAmount,
        goal.savedAmount || 0,
        goal.color,
        goal.icon,
        goal.deadline || null,
      ]
    );
    await refreshAll();
  };

  const updateSavingsGoalAmount = async (goalId: string, deltaAmount: number) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE savings_goals SET saved_amount = MAX(0, saved_amount + ?) WHERE id = ?`,
      [deltaAmount, goalId]
    );
    await refreshAll();
  };

  const deleteSavingsGoal = async (goalId: string) => {
    const db = await getDb();
    await db.runAsync(`DELETE FROM savings_goals WHERE id = ?`, [goalId]);
    await refreshAll();
  };

  // --- PRÉSTAMOS Y DEUDAS (ME DEBEN / YO DEBO) ---
  const addLoanRecord = async (loan: Omit<LoanRecord, 'id' | 'paidAmount' | 'isSettled'>) => {
    const db = await getDb();
    const id = `loan-${Date.now()}`;
    await db.runAsync(
      `INSERT INTO loans (id, person_name, direction, total_amount, paid_amount, notes, date, due_date, is_settled)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, 0)`,
      [
        id,
        loan.personName.trim(),
        loan.direction,
        loan.totalAmount,
        loan.notes || null,
        loan.date,
        loan.dueDate || null,
      ]
    );
    await refreshAll();
  };

  const registerLoanPayment = async (loanId: string, paymentAmount: number) => {
    const target = loans.find((l) => l.id === loanId);
    if (!target || paymentAmount <= 0) return;

    const newPaid = Math.min(target.totalAmount, target.paidAmount + paymentAmount);
    const settled = newPaid >= target.totalAmount ? 1 : 0;

    const db = await getDb();
    await db.runAsync(
      `UPDATE loans SET paid_amount = ?, is_settled = ? WHERE id = ?`,
      [newPaid, settled, loanId]
    );
    await refreshAll();
  };

  const deleteLoanRecord = async (loanId: string) => {
    const db = await getDb();
    await db.runAsync(`DELETE FROM loans WHERE id = ?`, [loanId]);
    await refreshAll();
  };

  // --- TRANSACCIONES Y TRANSFERENCIAS ---
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'isFromPlaid'>) => {
    const db = await getDb();
    const id = `tx-${Date.now()}`;
    const feeVal = tx.fee && tx.fee > 0 ? tx.fee : 0;

    await db.runAsync(
      `INSERT INTO transactions (
        id, account_id, to_account_id, category_id, type, amount, fee, description, merchant_name, date, is_from_plaid, recurring_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        id,
        tx.accountId,
        tx.toAccountId ?? null,
        tx.categoryId,
        tx.type,
        tx.amount,
        feeVal,
        tx.description.trim(),
        tx.merchantName ?? null,
        tx.date,
        tx.recurringId ?? null,
      ]
    );

    const acc = accounts.find((a) => a.id === tx.accountId);
    const isCreditCard = acc?.type === 'credit';

    if (tx.type === 'income') {
      const netIncome = tx.amount - feeVal;
      // En tarjeta de crédito un ingreso/abono reduce la deuda usada
      const delta = isCreditCard ? -netIncome : netIncome;
      await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
        delta,
        tx.accountId,
      ]);
    } else if (tx.type === 'expense') {
      const totalOut = tx.amount + feeVal;
      // En tarjeta de crédito un gasto aumenta el saldo utilizado
      const delta = isCreditCard ? totalOut : -totalOut;
      await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
        delta,
        tx.accountId,
      ]);
    }

    await refreshAll();
  };

  const transferBetweenAccounts = async ({
    fromAccountId,
    toAccountId,
    amount,
    fee = 0,
    description,
    date,
  }: TransferParams) => {
    if (fromAccountId === toAccountId || amount <= 0) return;

    const db = await getDb();
    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    const cleanFee = fee > 0 ? fee : 0;

    const txId = `tx-transfer-${Date.now()}`;
    const autoDesc =
      description?.trim() ||
      `Transferencia: ${fromAcc?.name || 'Origen'} → ${toAcc?.name || 'Destino'}`;

    await db.runAsync(
      `INSERT INTO transactions (
        id, account_id, to_account_id, category_id, type, amount, fee, description, date, is_from_plaid
      ) VALUES (?, ?, ?, 'cat-fees', 'transfer', ?, ?, ?, ?, 0)`,
      [txId, fromAccountId, toAccountId, amount, cleanFee, autoDesc, date]
    );

    await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
      amount + cleanFee,
      fromAccountId,
    ]);

    // Si la cuenta destino es una tarjeta de crédito, pagarle reduce la deuda usada
    if (toAcc?.type === 'credit') {
      await db.runAsync('UPDATE accounts SET balance = MAX(0, balance - ?) WHERE id = ?', [
        amount,
        toAccountId,
      ]);
    } else {
      await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
        amount,
        toAccountId,
      ]);
    }

    await refreshAll();
  };

  const deleteTransaction = async (txId: string) => {
    const db = await getDb();
    const target = transactions.find((t) => t.id === txId);
    if (!target) return;

    const feeVal = target.fee || 0;

    if (target.type === 'transfer' && target.toAccountId) {
      await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
        target.amount + feeVal,
        target.accountId,
      ]);
      await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
        target.amount,
        target.toAccountId,
      ]);
    } else if (target.type === 'income') {
      await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
        target.amount - feeVal,
        target.accountId,
      ]);
    } else {
      await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
        target.amount + feeVal,
        target.accountId,
      ]);
    }

    await db.runAsync('DELETE FROM transactions WHERE id = ?', [txId]);
    await refreshAll();
  };

  const addRecurringItem = async (item: Omit<RecurringItem, 'id' | 'active'>) => {
    const db = await getDb();
    const id = `rec-${Date.now()}`;
    await db.runAsync(
      `INSERT INTO recurring_items (
        id, title, amount, type, category_id, account_id, frequency, next_due_date, postponed_until, active, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        id,
        item.title.trim(),
        item.amount,
        item.type,
        item.categoryId,
        item.accountId,
        item.frequency,
        item.nextDueDate,
        item.postponedUntil ?? null,
        item.notes ?? null,
      ]
    );
    await refreshAll();
  };

  const confirmRecurringItem = async (
    recurringId: string,
    customAmount?: number,
    customFee?: number
  ) => {
    const item = recurringItems.find((r) => r.id === recurringId);
    if (!item) return;

    const finalAmount = customAmount !== undefined ? customAmount : item.amount;
    const today = new Date().toISOString().split('T')[0];

    await addTransaction({
      accountId: item.accountId,
      categoryId: item.categoryId,
      type: item.type,
      amount: finalAmount,
      fee: customFee || 0,
      description: `${item.title} (Recurrente confirmado)`,
      date: today,
      recurringId: item.id,
    });

    const nextCycleDate = calculateNextCycleDate(item.nextDueDate, item.frequency);
    const db = await getDb();
    await db.runAsync(
      `UPDATE recurring_items SET next_due_date = ?, postponed_until = NULL WHERE id = ?`,
      [nextCycleDate, recurringId]
    );
    await refreshAll();
  };

  const postponeRecurringItem = async (recurringId: string, daysToPostpone: number) => {
    const item = recurringItems.find((r) => r.id === recurringId);
    if (!item) return;

    const baseDate = item.postponedUntil || item.nextDueDate;
    const newDate = addDaysToDate(baseDate, daysToPostpone);

    const db = await getDb();
    await db.runAsync(
      `UPDATE recurring_items SET next_due_date = ?, postponed_until = ? WHERE id = ?`,
      [newDate, newDate, recurringId]
    );
    await refreshAll();
  };

  const skipRecurringCycle = async (recurringId: string) => {
    const item = recurringItems.find((r) => r.id === recurringId);
    if (!item) return;

    const nextCycleDate = calculateNextCycleDate(item.nextDueDate, item.frequency);
    const db = await getDb();
    await db.runAsync(
      `UPDATE recurring_items SET next_due_date = ?, postponed_until = NULL WHERE id = ?`,
      [nextCycleDate, recurringId]
    );
    await refreshAll();
  };

  const deleteRecurringItem = async (recurringId: string) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM recurring_items WHERE id = ?', [recurringId]);
    await refreshAll();
  };

  const resetToZero = async () => {
    const db = await getDb();
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM recurring_items;
      DELETE FROM accounts;
      DELETE FROM monthly_budgets;
      DELETE FROM savings_goals;
      DELETE FROM loans;
    `);
    await seedDefaultCategoriesOnly(db);
    await refreshAll();
  };

  const exportBackupJson = (): string => {
    const payload: AppBackupPayload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      accounts,
      categories,
      transactions,
      recurringItems,
      monthlyBudgets,
      savingsGoals,
      loans,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importBackupJson = async (rawJson: string) => {
    const parsed: AppBackupPayload = JSON.parse(rawJson);
    if (!parsed || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.categories)) {
      throw new Error('Formato de respaldo inválido');
    }

    const db = await getDb();
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM recurring_items;
      DELETE FROM accounts;
      DELETE FROM categories;
      DELETE FROM monthly_budgets;
      DELETE FROM savings_goals;
      DELETE FROM loans;
    `);

    for (const c of parsed.categories) {
      await db.runAsync(
        `INSERT INTO categories (id, name, type, color, icon, is_custom) VALUES (?, ?, ?, ?, ?, ?)`,
        [c.id, c.name, c.type, c.color, c.icon, c.isCustom ? 1 : 0]
      );
    }

    for (const a of parsed.accounts) {
      await db.runAsync(
        `INSERT INTO accounts (
          id, name, institution, mask, type, balance, currency,
          include_in_total, is_plaid_connected, plaid_account_id, plaid_item_id, color, last_synced_at,
          credit_limit, closing_day, due_day
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.name,
          a.institution,
          a.mask ?? null,
          a.type,
          a.balance,
          a.currency || 'USD',
          a.includeInTotal ? 1 : 0,
          a.isPlaidConnected ? 1 : 0,
          a.plaidAccountId ?? null,
          a.plaidItemId ?? null,
          a.color,
          a.lastSyncedAt ?? null,
          a.creditLimit ?? 0,
          a.closingDay ?? 0,
          a.dueDay ?? 0,
        ]
      );
    }

    for (const t of parsed.transactions || []) {
      await db.runAsync(
        `INSERT INTO transactions (
          id, account_id, to_account_id, category_id, type, amount, fee, description, merchant_name, date, is_from_plaid, plaid_transaction_id, recurring_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.accountId,
          t.toAccountId ?? null,
          t.categoryId,
          t.type,
          t.amount,
          t.fee ?? 0,
          t.description,
          t.merchantName ?? null,
          t.date,
          t.isFromPlaid ? 1 : 0,
          t.plaidTransactionId ?? null,
          t.recurringId ?? null,
        ]
      );
    }

    for (const r of parsed.recurringItems || []) {
      await db.runAsync(
        `INSERT INTO recurring_items (
          id, title, amount, type, category_id, account_id, frequency, next_due_date, postponed_until, active, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.title,
          r.amount,
          r.type,
          r.categoryId,
          r.accountId,
          r.frequency,
          r.nextDueDate,
          r.postponedUntil ?? null,
          r.active ? 1 : 0,
          r.notes ?? null,
        ]
      );
    }

    for (const b of parsed.monthlyBudgets || []) {
      await db.runAsync(
        `INSERT INTO monthly_budgets (id, title, limit_amount, category_id, manual_spent, color, icon)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [b.id, b.title, b.limitAmount, b.categoryId ?? null, b.manualSpent || 0, b.color, b.icon]
      );
    }

    for (const g of parsed.savingsGoals || []) {
      await db.runAsync(
        `INSERT INTO savings_goals (id, title, target_amount, saved_amount, color, icon, deadline)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [g.id, g.title, g.targetAmount, g.savedAmount || 0, g.color, g.icon, g.deadline ?? null]
      );
    }

    for (const l of parsed.loans || []) {
      await db.runAsync(
        `INSERT INTO loans (id, person_name, direction, total_amount, paid_amount, notes, date, due_date, is_settled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          l.id,
          l.personName,
          l.direction,
          l.totalAmount,
          l.paidAmount || 0,
          l.notes ?? null,
          l.date,
          l.dueDate ?? null,
          l.isSettled ? 1 : 0,
        ]
      );
    }

    await refreshAll();
  };

  const getCategoryBreakdown = useCallback(
    (
      type: 'expense' | 'income',
      accountFilterId?: string,
      yearMonthFilter?: string
    ): CategoryBreakdown[] => {
      const relevantTx = transactions.filter(
        (t) =>
          (!accountFilterId || accountFilterId === 'all' || t.accountId === accountFilterId) &&
          (!yearMonthFilter || yearMonthFilter === 'all' || t.date.startsWith(yearMonthFilter))
      );

      const map = new Map<string, { total: number; count: number }>();
      let grandTotal = 0;

      for (const tx of relevantTx) {
        if (tx.type === type) {
          const prev = map.get(tx.categoryId) || { total: 0, count: 0 };
          map.set(tx.categoryId, {
            total: prev.total + tx.amount,
            count: prev.count + 1,
          });
          grandTotal += tx.amount;
        }

        if (type === 'expense' && tx.fee && tx.fee > 0) {
          const prevFee = map.get('cat-fees') || { total: 0, count: 0 };
          map.set('cat-fees', {
            total: prevFee.total + tx.fee,
            count: prevFee.count + 1,
          });
          grandTotal += tx.fee;
        }
      }

      if (grandTotal === 0) return [];

      const result: CategoryBreakdown[] = [];
      for (const [categoryId, stats] of map.entries()) {
        const cat = categories.find((c) => c.id === categoryId);
        result.push({
          categoryId,
          categoryName: cat ? cat.name : 'Comisiones / Otros',
          color: cat ? cat.color : '#94A3B8',
          icon: cat ? cat.icon : 'card-outline',
          total: stats.total,
          percentage: (stats.total / grandTotal) * 100,
          count: stats.count,
        });
      }

      return result.sort((a, b) => b.total - a.total);
    },
    [transactions, categories]
  );

  return (
    <FinanceContext.Provider
      value={{
        loading,
        accounts,
        categories,
        transactions,
        recurringItems,
        monthlyBudgets,
        savingsGoals,
        loans,
        backendUrl,
        setBackendUrl,
        includedTotalBalance,
        excludedTotalBalance,
        netWorthBalance,
        toggleAccountIncludeInTotal,
        addManualAccount,
        updateCreditCardDetails,
        connectSandboxUSBank,
        deleteAccount,
        addCategory,
        deleteCategory,
        addMonthlyBudget,
        addManualSpendToBudget,
        deleteMonthlyBudget,
        getBudgetSpentAmount,
        addSavingsGoal,
        updateSavingsGoalAmount,
        deleteSavingsGoal,
        addLoanRecord,
        registerLoanPayment,
        deleteLoanRecord,
        addTransaction,
        transferBetweenAccounts,
        deleteTransaction,
        addRecurringItem,
        confirmRecurringItem,
        postponeRecurringItem,
        skipRecurringCycle,
        deleteRecurringItem,
        getCategoryBreakdown,
        resetToZero,
        exportBackupJson,
        importBackupJson,
        refreshAll,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance debe usarse dentro de un FinanceProvider');
  }
  return ctx;
}
