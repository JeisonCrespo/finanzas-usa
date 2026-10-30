import { BankAccount, Transaction } from '../types/finance';

// URL oficial de tu servidor desplegado en Vercel
export const PLAID_BACKEND_URL = 'https://finanzas-usa-puce.vercel.app/api';

export interface PlaidSyncResponse {
  accounts: BankAccount[];
  transactions: Omit<Transaction, 'id'>[];
}

/**
 * Solicita un link_token al backend en Vercel para abrir el modal nativo de Plaid Link en Android
 */
export async function createPlaidLinkToken(
  userId = 'user-default',
  customBaseUrl = PLAID_BACKEND_URL
): Promise<string> {
  const response = await fetch(`${customBaseUrl}/create_link_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener el Link Token del servidor Plaid');
  }

  const data = await response.json();
  return data.link_token;
}

/**
 * Intercambia el public_token devuelto por el SDK de Android por un access_token permanente
 * y descarga las cuentas bancarias y transacciones iniciales de EE. UU.
 */
export async function exchangePlaidPublicToken(
  publicToken: string,
  institutionName: string,
  customBaseUrl = PLAID_BACKEND_URL
): Promise<PlaidSyncResponse> {
  const response = await fetch(`${customBaseUrl}/exchange_public_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_token: publicToken, institutionName }),
  });

  if (!response.ok) {
    throw new Error('Error al intercambiar el public_token con Plaid');
  }

  return response.json();
}

export const US_SANDBOX_BANKS = [
  {
    id: 'wells_fargo',
    institution: 'Wells Fargo',
    accountName: 'Everyday Checking',
    mask: '3319',
    type: 'checking' as const,
    balance: 2190.5,
    color: '#D97706',
    sampleTransactions: [
      {
        description: 'Target Superstore',
        merchantName: 'Target',
        amount: 78.45,
        type: 'expense' as const,
        categoryId: 'cat-shopping',
      },
      {
        description: 'Trader Joe’s Grocery',
        merchantName: 'Trader Joe’s',
        amount: 94.2,
        type: 'expense' as const,
        categoryId: 'cat-groceries',
      },
    ],
  },
  {
    id: 'capital_one',
    institution: 'Capital One',
    accountName: '360 Performance Savings',
    mask: '8054',
    type: 'savings' as const,
    balance: 6400.0,
    color: '#0284C7',
    sampleTransactions: [
      {
        description: 'Monthly APY Interest Payment',
        merchantName: 'Capital One Interest',
        amount: 24.5,
        type: 'income' as const,
        categoryId: 'cat-investments',
      },
    ],
  },
  {
    id: 'amex',
    institution: 'American Express',
    accountName: 'Amex Gold Card',
    mask: '1008',
    type: 'credit' as const,
    balance: -640.25,
    color: '#CA8A04',
    sampleTransactions: [
      {
        description: 'Uber Eats Delivery',
        merchantName: 'Uber Eats',
        amount: 34.8,
        type: 'expense' as const,
        categoryId: 'cat-dining',
      },
      {
        description: 'CVS Pharmacy',
        merchantName: 'CVS',
        amount: 21.15,
        type: 'expense' as const,
        categoryId: 'cat-health',
      },
    ],
  },
];
