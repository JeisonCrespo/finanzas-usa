require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

const app = express();
app.use(cors());
app.use(express.json());

const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'; // 'sandbox' | 'development' | 'production'

function getPlaidClient(customClientId, customSecret) {
  const clientId = (customClientId || process.env.PLAID_CLIENT_ID || '').trim();
  const secret = (customSecret || process.env.PLAID_SECRET || '').trim();

  const config = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV] || PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  });

  return new PlaidApi(config);
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Finanzas USA Backend',
    version: '1.2.0',
    plaidConfiguredOnServer: Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET),
  });
});

/**
 * 1. Genera un link_token seguro para abrir Plaid Link en Android (com.jeison.finanzasusa)
 */
app.post('/api/create_link_token', async (req, res) => {
  try {
    const { userId = 'user-android-1', plaidClientId, plaidSecret } = req.body || {};
    const client = getPlaidClient(plaidClientId, plaidSecret);

    const response = await client.linkTokenCreate({
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
    const { public_token, institutionName = 'US Bank', plaidClientId, plaidSecret } = req.body || {};
    const client = getPlaidClient(plaidClientId, plaidSecret);

    const exchangeRes = await client.itemPublicTokenExchange({ public_token });
    const accessToken = exchangeRes.data.access_token;
    const itemId = exchangeRes.data.item_id;

    // Obtener cuentas bancarias vinculadas (Checking, Savings, Credit Card)
    const accountsRes = await client.accountsGet({ access_token: accessToken });

    // Sincronizar últimas transacciones con /transactions/sync
    const syncRes = await client.transactionsSync({ access_token: accessToken });

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
      type: tx.amount > 0 ? 'expense' : 'income',
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
