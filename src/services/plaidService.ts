import { AccountType, BankAccount, Transaction } from '../types/finance';

// URL oficial de tu servidor desplegado en Vercel
export const PLAID_BACKEND_URL = 'https://finanzas-usa-puce.vercel.app/api';

// Llaves oficiales de Plaid preconfiguradas para tu app
export const DEFAULT_PLAID_CLIENT_ID = '6ae40f2e5fba34000d7ce0ad';
export const DEFAULT_PLAID_SECRET = '0b77eb6c08bff757e3b7244111f670';

export interface PlaidSyncResponse {
  accounts: BankAccount[];
  transactions: Omit<Transaction, 'id'>[];
}

export interface USBankTemplate {
  id: string;
  plaidInstitutionId: string;
  institution: string;
  shortName: string;
  color: string;
  defaultCheckingName: string;
  defaultSavingsName: string;
  defaultCreditName: string;
  defaultMask: string;
}

/**
 * Catálogo directo de los principales bancos de EE. UU. (Encabezado por Wells Fargo, Chase y Truist)
 */
export const US_MAJOR_BANKS: USBankTemplate[] = [
  {
    id: 'wells_fargo',
    plaidInstitutionId: 'ins_127991',
    institution: 'Wells Fargo',
    shortName: 'Wells Fargo',
    color: '#D97706',
    defaultCheckingName: 'Wells Fargo Everyday Checking',
    defaultSavingsName: 'Wells Fargo Way2Save Savings',
    defaultCreditName: 'Wells Fargo Active Cash Card',
    defaultMask: '3319',
  },
  {
    id: 'chase',
    plaidInstitutionId: 'ins_56',
    institution: 'JPMorgan Chase',
    shortName: 'Chase',
    color: '#1D4ED8',
    defaultCheckingName: 'Chase Total Checking',
    defaultSavingsName: 'Chase Premier Savings',
    defaultCreditName: 'Chase Freedom Unlimited',
    defaultMask: '4829',
  },
  {
    id: 'truist',
    plaidInstitutionId: 'ins_109508',
    institution: 'Truist Bank',
    shortName: 'Truist',
    color: '#7C3AED',
    defaultCheckingName: 'Truist One Checking',
    defaultSavingsName: 'Truist One Savings',
    defaultCreditName: 'Truist Enjoy Cash Card',
    defaultMask: '6104',
  },
  {
    id: 'bofa',
    plaidInstitutionId: 'ins_127989',
    institution: 'Bank of America',
    shortName: 'Bank of America',
    color: '#DC2626',
    defaultCheckingName: 'BofA Advantage Banking',
    defaultSavingsName: 'BofA Advantage Savings',
    defaultCreditName: 'BofA Customized Cash Rewards',
    defaultMask: '9912',
  },
  {
    id: 'capital_one',
    plaidInstitutionId: 'ins_128026',
    institution: 'Capital One',
    shortName: 'Capital One',
    color: '#0284C7',
    defaultCheckingName: '360 Checking',
    defaultSavingsName: '360 Performance Savings',
    defaultCreditName: 'Capital One Quicksilver / Venture',
    defaultMask: '8054',
  },
  {
    id: 'citi',
    plaidInstitutionId: 'ins_127990',
    institution: 'Citibank',
    shortName: 'Citibank',
    color: '#0369A1',
    defaultCheckingName: 'Citi Access Checking',
    defaultSavingsName: 'Citi Accelerate Savings',
    defaultCreditName: 'Citi Double Cash Card',
    defaultMask: '5521',
  },
  {
    id: 'amex',
    plaidInstitutionId: 'ins_10',
    institution: 'American Express',
    shortName: 'Amex',
    color: '#CA8A04',
    defaultCheckingName: 'Amex Rewards Checking',
    defaultSavingsName: 'Amex High Yield Savings',
    defaultCreditName: 'Amex Gold / Blue Cash',
    defaultMask: '1008',
  },
  {
    id: 'us_bank',
    plaidInstitutionId: 'ins_109511',
    institution: 'U.S. Bank / PNC',
    shortName: 'U.S. Bank',
    color: '#2563EB',
    defaultCheckingName: 'Smartly Checking',
    defaultSavingsName: 'Standard Savings',
    defaultCreditName: 'Cash+ Visa Signature',
    defaultMask: '2290',
  },
];

/**
 * Conecta directamente una institución bancaria (Wells Fargo, Chase, Truist...) usando tus llaves en la API real de Plaid
 */
export async function connectPlaidInstitutionLive(
  bank: USBankTemplate,
  customBaseUrl = PLAID_BACKEND_URL,
  plaidClientId = DEFAULT_PLAID_CLIENT_ID,
  plaidSecret = DEFAULT_PLAID_SECRET
): Promise<{ item_id: string; accounts: BankAccount[] }> {
  const response = await fetch(`${customBaseUrl}/connect_plaid_institution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      institutionId: bank.plaidInstitutionId,
      institutionName: bank.institution,
      color: bank.color,
      plaidClientId: plaidClientId || DEFAULT_PLAID_CLIENT_ID,
      plaidSecret: plaidSecret || DEFAULT_PLAID_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al conectar institución con Plaid API');
  }

  return response.json();
}

/**
 * Solicita un link_token al backend en Vercel para abrir el modal nativo de Plaid Link en Android
 */
export async function createPlaidLinkToken(
  userId = 'user-default',
  customBaseUrl = PLAID_BACKEND_URL,
  plaidClientId?: string,
  plaidSecret?: string
): Promise<string> {
  const response = await fetch(`${customBaseUrl}/create_link_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      plaidClientId: plaidClientId || undefined,
      plaidSecret: plaidSecret || undefined,
    }),
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
  customBaseUrl = PLAID_BACKEND_URL,
  plaidClientId?: string,
  plaidSecret?: string
): Promise<PlaidSyncResponse> {
  const response = await fetch(`${customBaseUrl}/exchange_public_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public_token: publicToken,
      institutionName,
      plaidClientId: plaidClientId || undefined,
      plaidSecret: plaidSecret || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al intercambiar el public_token con Plaid');
  }

  return response.json();
}

export const US_SANDBOX_BANKS: {
  id: string;
  institution: string;
  accountName: string;
  mask: string;
  type: AccountType;
  balance: number;
  color: string;
  sampleTransactions: {
    description: string;
    merchantName: string;
    amount: number;
    type: 'expense' | 'income';
    categoryId: string;
  }[];
}[] = [
  {
    id: 'wells_fargo',
    institution: 'Wells Fargo',
    accountName: 'Everyday Checking',
    mask: '3319',
    type: 'checking',
    balance: 2190.5,
    color: '#D97706',
    sampleTransactions: [
      {
        description: 'Target Superstore',
        merchantName: 'Target',
        amount: 78.45,
        type: 'expense',
        categoryId: 'cat-shopping',
      },
      {
        description: 'Trader Joe’s Grocery',
        merchantName: 'Trader Joe’s',
        amount: 94.2,
        type: 'expense',
        categoryId: 'cat-groceries',
      },
    ],
  },
  {
    id: 'chase_checking',
    institution: 'JPMorgan Chase',
    accountName: 'Chase Total Checking',
    mask: '4829',
    type: 'checking',
    balance: 3450.75,
    color: '#1D4ED8',
    sampleTransactions: [
      {
        description: 'Zelle Transfer Received',
        merchantName: 'Zelle',
        amount: 250.0,
        type: 'income',
        categoryId: 'cat-salary',
      },
    ],
  },
  {
    id: 'truist_checking',
    institution: 'Truist Bank',
    accountName: 'Truist One Checking',
    mask: '6104',
    type: 'checking',
    balance: 1840.0,
    color: '#7C3AED',
    sampleTransactions: [
      {
        description: 'Publix Super Markets',
        merchantName: 'Publix',
        amount: 86.3,
        type: 'expense',
        categoryId: 'cat-groceries',
      },
    ],
  },
  {
    id: 'capital_one',
    institution: 'Capital One',
    accountName: '360 Performance Savings',
    mask: '8054',
    type: 'savings',
    balance: 6400.0,
    color: '#0284C7',
    sampleTransactions: [
      {
        description: 'Monthly APY Interest Payment',
        merchantName: 'Capital One Interest',
        amount: 24.5,
        type: 'income',
        categoryId: 'cat-investments',
      },
    ],
  },
  {
    id: 'amex',
    institution: 'American Express',
    accountName: 'Amex Gold Card',
    mask: '1008',
    type: 'credit',
    balance: 640.25,
    color: '#CA8A04',
    sampleTransactions: [
      {
        description: 'Uber Eats Delivery',
        merchantName: 'Uber Eats',
        amount: 34.8,
        type: 'expense',
        categoryId: 'cat-dining',
      },
    ],
  },
];
