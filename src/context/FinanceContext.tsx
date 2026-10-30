import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  BankAccount,
  Category,
  CategoryBreakdown,
  RecurringItem,
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
  backendUrl: string;
  setBackendUrl: (url: string) => Promise<void>;
  includedTotalBalance: number;
  excludedTotalBalance: number;
  netWorthBalance: number;
  toggleAccountIncludeInTotal: (accountId: string) => Promise<void>;
  addManualAccount: (account: Omit<BankAccount, 'id' | 'isPlaidConnected'>) => Promise<void>;
  connectSandboxUSBank: (bankPresetId: string, includeInTotal: boolean) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'isCustom'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'isFromPlaid'>) => Promise<void>;
  transferBetweenAccounts: (params: TransferParams) => Promise<void>;
  deleteTransaction: (txId: string) => Promise<void>;
  addRecurringItem: (item: Omit<RecurringItem, 'id' | 'active'>) => Promise<void>;
  confirmRecurringItem: (recurringId: string, customAmount?: number, customFee?: number) => Promise<void>;
  postponeRecurringItem: (recurringId: string, daysToPostpone: number) => Promise<void>;
  skipRecurringCycle: (recurringId: string) => Promise<void>;
  deleteRecurringItem: (recurringId: string) => Promise<void>;
  getCategoryBreakdown: (type: 'expense' | 'income', accountFilterId?: string) => CategoryBreakdown[];
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
        id, name, institution, mask, type, balance, currency, include_in_total, is_plaid_connected, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
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
      ]
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
        include_in_total, is_plaid_connected, plaid_account_id, color, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, 1, ?, ?, ?)`,
      [
        accountId,
        preset.accountName,
        preset.institution,
        preset.mask,
        preset.type,
        preset.balance,
        includeInTotal ? 1 : 0,
        `plaid_${preset.id}`,
        preset.color,
        nowIso,
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

  /**
   * Registra un Gasto o Ingreso con soporte de Comisión Opcional (`fee`).
   * - Si es Gasto ($100 + $2.50 comisión): descuenta $102.50 de la cuenta.
   * - Si es Ingreso ($500 con $5 comisión): suma $495.00 netos a la cuenta.
   */
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

    if (tx.type === 'income') {
      const netIncome = tx.amount - feeVal;
      await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
        netIncome,
        tx.accountId,
      ]);
    } else if (tx.type === 'expense') {
      const totalOut = tx.amount + feeVal;
      await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
        totalOut,
        tx.accountId,
      ]);
    }

    await refreshAll();
  };

  /**
   * TRANSFERENCIA ENTRE CUENTAS CON COMISIÓN OPCIONAL:
   * - Descuenta (amount + fee) de la cuenta de origen (`fromAccountId`)
   * - Suma (amount) a la cuenta de destino (`toAccountId`)
   */
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

    // Descontar monto + comisión de la cuenta origen
    await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
      amount + cleanFee,
      fromAccountId,
    ]);

    // Sumar monto a la cuenta destino
    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
      amount,
      toAccountId,
    ]);

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
    `);
    await seedDefaultCategoriesOnly(db);
    await refreshAll();
  };

  const exportBackupJson = (): string => {
    const payload: AppBackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts,
      categories,
      transactions,
      recurringItems,
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
          include_in_total, is_plaid_connected, plaid_account_id, plaid_item_id, color, last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    await refreshAll();
  };

  const getCategoryBreakdown = useCallback(
    (type: 'expense' | 'income', accountFilterId?: string): CategoryBreakdown[] => {
      const relevantTx = transactions.filter(
        (t) =>
          !accountFilterId || accountFilterId === 'all' || t.accountId === accountFilterId
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

        // Si cualquier movimiento o transferencia tuvo comisión bancaria, sumarla a Comisiones en la gráfica de gastos
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
        backendUrl,
        setBackendUrl,
        includedTotalBalance,
        excludedTotalBalance,
        netWorthBalance,
        toggleAccountIncludeInTotal,
        addManualAccount,
        connectSandboxUSBank,
        deleteAccount,
        addCategory,
        deleteCategory,
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
