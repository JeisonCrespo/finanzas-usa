require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

const app = express();
app.use(cors());
app.use(express.json());

const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'; // 'sandbox' | 'development' | 'production'

const config = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

const plaidClient = new PlaidApi(config);

/**
 * 1. Genera un link_token seguro para abrir Plaid Link en Android (com.jeison.finanzasusa)
 */
app.post('/api/create_link_token', async (req, res) => {
  try {
    const { userId = 'user-android-1' } = req.body;
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: String(userId) },
      client_name: 'Finanzas USA Android',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'es',
      android_package_name: 'com.jeison.finanzasusa',
    });

    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creando link_token:', error.response?.data || error.message);
    res.status(500).json({ error: 'No se pudo generar el link_token de Plaid' });
  }
});

/**
 * 2. Intercambia el public_token devuelto por la app Android por un access_token
 *    y obtiene las cuentas y movimientos iniciales del banco estadounidense.
 */
app.post('/api/exchange_public_token', async (req, res) => {
  try {
    const { public_token, institutionName = 'US Bank' } = req.body;

    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = exchangeRes.data.access_token;
    const itemId = exchangeRes.data.item_id;

    // Obtener cuentas bancarias vinculadas (Checking, Savings, Credit Card)
    const accountsRes = await plaidClient.accountsGet({ access_token: accessToken });

    // Sincronizar últimas transacciones con /transactions/sync
    const syncRes = await plaidClient.transactionsSync({ access_token: accessToken });

    const mappedAccounts = accountsRes.data.accounts.map((acc) => ({
      id: `acc-plaid-${acc.account_id}`,
      name: acc.name,
      institution: institutionName,
      mask: acc.mask || undefined,
      type: acc.subtype === 'savings' ? 'savings' : acc.type === 'credit' ? 'credit' : 'checking',
      balance: acc.balances.current || 0,
      currency: acc.balances.iso_currency_code || 'USD',
      includeInTotal: true,
      isPlaidConnected: true,
      plaidAccountId: acc.account_id,
      plaidItemId: itemId,
      color: '#1D4ED8',
      lastSyncedAt: new Date().toISOString(),
    }));

    const mappedTransactions = syncRes.data.added.map((tx) => ({
      accountId: `acc-plaid-${tx.account_id}`,
      categoryId: tx.amount > 0 ? 'cat-shopping' : 'cat-salary',
      type: tx.amount > 0 ? 'expense' : 'income', // En Plaid los montos positivos son cargos/gastos
      amount: Math.abs(tx.amount),
      description: tx.name,
      merchantName: tx.merchant_name || tx.name,
      date: tx.date,
      isFromPlaid: true,
      plaidTransactionId: tx.transaction_id,
    }));

    res.json({
      item_id: itemId,
      accounts: mappedAccounts,
      transactions: mappedTransactions,
    });
  } catch (error) {
    console.error('Error en exchange_public_token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Fallo al sincronizar cuenta con Plaid' });
  }
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor Plaid US corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
