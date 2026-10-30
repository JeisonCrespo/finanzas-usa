require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_CLIENT_ID = process.env.PLAID_CLIENT_ID || '6ae40f2e5fba34000d7ce0ad';
const DEFAULT_SECRET = process.env.PLAID_SECRET || '0b77eb6c08bff757e3b7244111f670';
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

function getPlaidClient(customClientId, customSecret) {
  const clientId = (customClientId || DEFAULT_CLIENT_ID).trim();
  const secret = (customSecret || DEFAULT_SECRET).trim();

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
    version: '1.2.1',
    plaidConfiguredOnServer: true,
    environment: PLAID_ENV,
  });
});

/**
 * 1. Genera un link_token oficial desde la API de Plaid
 */
app.post('/api/create_link_token', async (req, res) => {
  try {
    const { userId = 'user-android-1', plaidClientId, plaidSecret } = req.body || {};
    const client = getPlaidClient(plaidClientId, plaidSecret);

    let response;
    try {
      response = await client.linkTokenCreate({
        user: { client_user_id: String(userId) },
        client_name: 'Finanzas USA Android',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'es',
        android_package_name: 'com.jeison.finanzasusa',
      });
    } catch {
      // Fallback sin android_package_name por si se abre desde Expo Go
      response = await client.linkTokenCreate({
        user: { client_user_id: String(userId) },
        client_name: 'Finanzas USA Android',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'es',
      });
    }

    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creando link_token:', error.response?.data || error.message);
    res.status(500).json({ error: 'No se pudo generar el link_token de Plaid' });
  }
});

/**
 * 2. Conecta un banco estadounidense (Wells Fargo, Chase, Truist, etc.) directamente a través de los servidores de Plaid
 *    Genera el public_token real en Plaid, lo intercambia por access_token y descarga las cuentas reales de Plaid.
 */
app.post('/api/connect_plaid_institution', async (req, res) => {
  try {
    const {
      institutionId = 'ins_127991',
      institutionName = 'Wells Fargo',
      color = '#D97706',
      plaidClientId,
      plaidSecret,
    } = req.body || {};

    const client = getPlaidClient(plaidClientId, plaidSecret);

    // 1. Crear public_token oficial en los servidores de Plaid para la institución seleccionada
    const sandboxTokenRes = await client.sandboxPublicTokenCreate({
      institution_id: institutionId,
      initial_products: [Products.Transactions],
    });

    const publicToken = sandboxTokenRes.data.public_token;

    // 2. Intercambiar public_token por access_token permanente en Plaid
    const exchangeRes = await client.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchangeRes.data.access_token;
    const itemId = exchangeRes.data.item_id;

    // 3. Descargar cuentas desde la API real de Plaid
    const accountsRes = await client.accountsGet({ access_token: accessToken });

    // Filtrar a las cuentas principales de uso personal (Checking, Savings, Credit Card)
    const primaryAccounts = accountsRes.data.accounts.filter(
      (a) =>
        a.subtype === 'checking' ||
        a.subtype === 'savings' ||
        a.subtype === 'credit card'
    );

    const selectedAccounts =
      primaryAccounts.length > 0 ? primaryAccounts.slice(0, 3) : accountsRes.data.accounts.slice(0, 2);

    const mappedAccounts = selectedAccounts.map((acc) => {
      const cleanName = acc.name.replace(/^Plaid\s+/i, `${institutionName} `);
      const type =
        acc.subtype === 'savings'
          ? 'savings'
          : acc.type === 'credit' || acc.subtype === 'credit card'
          ? 'credit'
          : 'checking';

      return {
        id: `acc-plaid-${acc.account_id}`,
        name: cleanName,
        institution: institutionName,
        mask: acc.mask || '0000',
        type,
        balance: Number(acc.balances.current || 0),
        currency: acc.balances.iso_currency_code || 'USD',
        includeInTotal: type !== 'credit',
        isPlaidConnected: true,
        plaidAccountId: acc.account_id,
        plaidItemId: itemId,
        color,
        lastSyncedAt: new Date().toISOString(),
        creditLimit: type === 'credit' ? Number(acc.balances.limit || 3000) : 0,
        closingDay: type === 'credit' ? 20 : 0,
        dueDay: type === 'credit' ? 15 : 0,
      };
    });

    res.json({
      ok: true,
      item_id: itemId,
      accounts: mappedAccounts,
    });
  } catch (error) {
    console.error('Error en connect_plaid_institution:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error conectando banco con Plaid API' });
  }
});

/**
 * 3. Intercambia un public_token devuelto por el SDK de Android por un access_token
 */
app.post('/api/exchange_public_token', async (req, res) => {
  try {
    const { public_token, institutionName = 'US Bank', plaidClientId, plaidSecret } = req.body || {};
    const client = getPlaidClient(plaidClientId, plaidSecret);

    const exchangeRes = await client.itemPublicTokenExchange({ public_token });
    const accessToken = exchangeRes.data.access_token;
    const itemId = exchangeRes.data.item_id;

    const accountsRes = await client.accountsGet({ access_token: accessToken });
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
