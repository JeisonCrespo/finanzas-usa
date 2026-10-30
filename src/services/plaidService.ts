export interface USBankTemplate {
  id: string;
  institution: string;
  shortName: string;
  color: string;
  defaultCheckingName: string;
  defaultSavingsName: string;
  defaultCreditName: string;
  defaultMask: string;
}

/**
 * Catálogo directo de los principales bancos y billeteras en EE. UU.
 * Incluye Wells Fargo, Chase, Truist, PayPal, Uber, Bank of America, Capital One, Citibank, Amex y U.S. Bank
 */
export const US_MAJOR_BANKS: USBankTemplate[] = [
  {
    id: 'wells_fargo',
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
    institution: 'Truist Bank',
    shortName: 'Truist',
    color: '#7C3AED',
    defaultCheckingName: 'Truist One Checking',
    defaultSavingsName: 'Truist One Savings',
    defaultCreditName: 'Truist Enjoy Cash Card',
    defaultMask: '6104',
  },
  {
    id: 'paypal',
    institution: 'PayPal',
    shortName: 'PayPal',
    color: '#0070BA',
    defaultCheckingName: 'PayPal Balance / Debit Card',
    defaultSavingsName: 'PayPal Savings (APY)',
    defaultCreditName: 'PayPal Cashback Mastercard',
    defaultMask: '7710',
  },
  {
    id: 'uber',
    institution: 'Uber Pro Card / Uber Wallet',
    shortName: 'Uber',
    color: '#10B981',
    defaultCheckingName: 'Uber Pro Card / Driver Balance',
    defaultSavingsName: 'Uber Pro Backup / Savings',
    defaultCreditName: 'Uber Visa Card',
    defaultMask: '8821',
  },
  {
    id: 'bofa',
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
    institution: 'U.S. Bank / PNC',
    shortName: 'U.S. Bank',
    color: '#2563EB',
    defaultCheckingName: 'Smartly Checking',
    defaultSavingsName: 'Standard Savings',
    defaultCreditName: 'Cash+ Visa Signature',
    defaultMask: '2290',
  },
];
