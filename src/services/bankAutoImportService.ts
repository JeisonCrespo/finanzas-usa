import { BankAccount } from '../types/finance';

export interface ParsedBankMovement {
  description: string;
  merchantName: string;
  amount: number;
  type: 'expense' | 'income';
  date: string; // YYYY-MM-DD
  categoryId: string;
  detectedBankHint?: string; // 'wells', 'chase', 'truist', o últimos 4 dígitos
}

/**
 * Detecta automáticamente la categoría ideal según el comercio o descripción de EE. UU.
 */
export function autoDetectCategoryId(text: string, type: 'expense' | 'income'): string {
  if (type === 'income') {
    const lowerInc = text.toLowerCase();
    if (lowerInc.includes('interest') || lowerInc.includes('dividend') || lowerInc.includes('apy')) {
      return 'cat-investments';
    }
    return 'cat-salary';
  }

  const lower = text.toLowerCase();

  if (
    lower.includes('walmart') ||
    lower.includes('target') ||
    lower.includes('publix') ||
    lower.includes('costco') ||
    lower.includes('whole foods') ||
    lower.includes('trader joe') ||
    lower.includes('aldi') ||
    lower.includes('kroger') ||
    lower.includes('heb') ||
    lower.includes('grocery') ||
    lower.includes('supermarket') ||
    lower.includes('supermercado')
  ) {
    return 'cat-groceries';
  }

  if (
    lower.includes('mcdonald') ||
    lower.includes('starbucks') ||
    lower.includes('chipotle') ||
    lower.includes('chick-fil-a') ||
    lower.includes('wendy') ||
    lower.includes('burger') ||
    lower.includes('taco') ||
    lower.includes('pizza') ||
    lower.includes('doordash') ||
    lower.includes('uber eats') ||
    lower.includes('grubhub') ||
    lower.includes('restaurant') ||
    lower.includes('cafe') ||
    lower.includes('dunkin')
  ) {
    return 'cat-dining';
  }

  if (
    lower.includes('uber') ||
    lower.includes('lyft') ||
    lower.includes('shell') ||
    lower.includes('chevron') ||
    lower.includes('exxon') ||
    lower.includes('bp ') ||
    lower.includes('mobil') ||
    lower.includes('wawa') ||
    lower.includes('gas') ||
    lower.includes('parking') ||
    lower.includes('sunpass') ||
    lower.includes('ezpass') ||
    lower.includes('toll')
  ) {
    return 'cat-transport';
  }

  if (
    lower.includes('netflix') ||
    lower.includes('spotify') ||
    lower.includes('disney') ||
    lower.includes('hulu') ||
    lower.includes('youtube') ||
    lower.includes('max') ||
    lower.includes('hbo') ||
    lower.includes('apple.com/bill') ||
    lower.includes('icloud') ||
    lower.includes('prime video')
  ) {
    return 'cat-subscriptions';
  }

  if (
    lower.includes('steam') ||
    lower.includes('playstation') ||
    lower.includes('xbox') ||
    lower.includes('nintendo') ||
    lower.includes('epic games') ||
    lower.includes('riot') ||
    lower.includes('twitch') ||
    lower.includes('discord')
  ) {
    return 'cat-gaming';
  }

  if (
    lower.includes('at&t') ||
    lower.includes('t-mobile') ||
    lower.includes('verizon') ||
    lower.includes('xfinity') ||
    lower.includes('comcast') ||
    lower.includes('spectrum') ||
    lower.includes('fpl') ||
    lower.includes('duke energy') ||
    lower.includes('water') ||
    lower.includes('electric')
  ) {
    return 'cat-utilities';
  }

  if (
    lower.includes('cvs') ||
    lower.includes('walgreens') ||
    lower.includes('pharmacy') ||
    lower.includes('hospital') ||
    lower.includes('clinic') ||
    lower.includes('doctor') ||
    lower.includes('dental')
  ) {
    return 'cat-health';
  }

  if (lower.includes('rent') || lower.includes('apartments') || lower.includes('mortgage') || lower.includes('hoa')) {
    return 'cat-housing';
  }

  return 'cat-shopping';
}

/**
 * Normaliza fechas de EE. UU. (MM/DD/YYYY o YYYY-MM-DD) al formato YYYY-MM-DD
 */
function normalizeUSDate(rawDate?: string): string {
  const today = new Date().toISOString().split('T')[0];
  if (!rawDate) return today;
  const clean = rawDate.trim().replace(/["']/g, '');

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // MM/DD/YYYY o M/D/YYYY
  const mdy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    const mm = mdy[1].padStart(2, '0');
    const dd = mdy[2].padStart(2, '0');
    const yyyy = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return today;
}

/**
 * Analiza texto pegado desde:
 * 1. Notificaciones o SMS de Chase, Wells Fargo, Truist o Zelle (en inglés o español)
 * 2. Líneas copiadas de un estado de cuenta o archivo .CSV de Wells Fargo, Chase o Truist
 */
export function parseBankAlertsOrCsv(rawText: string): ParsedBankMovement[] {
  const results: ParsedBankMovement[] = [];
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const today = new Date().toISOString().split('T')[0];

  for (const line of lines) {
    // Ignorar encabezados de CSV comunes en Chase / Wells Fargo / Truist
    if (/^(transaction date|date,description|posted date|"date")/i.test(line)) {
      continue;
    }

    // Caso A: Formato CSV de Wells Fargo -> "10/28/2026","-45.20","*","","PUBLIX SUPER MAR..."
    // o CSV de Chase / Truist -> 10/28/2026,10/29/2026,AMAZON.COM,Shopping,Sale,-24.99,
    if (line.includes(',') && /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/.test(line)) {
      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const dateCol = cols.find((c) => /^\d{1,2}\/\d{1,2}\/\d{2,4}$|^\d{4}-\d{2}-\d{2}$/.test(c));
      const amountCol = cols.find((c) => /^-?\$?\d+(\.\d{1,2})?$/.test(c));
      const descCandidates = cols.filter(
        (c) =>
          c !== dateCol &&
          c !== amountCol &&
          c !== '*' &&
          c.length > 2 &&
          !/^(sale|return|payment|debit|credit|check)$/i.test(c)
      );

      if (amountCol && descCandidates.length > 0) {
        const rawNum = parseFloat(amountCol.replace('$', ''));
        if (!isNaN(rawNum) && rawNum !== 0) {
          const isIncome = rawNum > 0 && /deposit|payroll|zelle from|credit|payment received/i.test(line);
          const type: 'expense' | 'income' = rawNum < 0 ? 'expense' : isIncome ? 'income' : 'expense';
          const cleanAmt = Math.abs(rawNum);
          const desc = descCandidates[0];
          results.push({
            description: desc,
            merchantName: desc,
            amount: cleanAmt,
            type,
            date: normalizeUSDate(dateCol),
            categoryId: autoDetectCategoryId(desc, type),
          });
          continue;
        }
      }
    }

    // Caso B: Notificación / Alerta / SMS de Chase, Wells Fargo, Truist o Zelle
    // Ejemplos soportados:
    // - "Chase: You made a $24.50 transaction with AMAZON.COM on Oct 29"
    // - "Wells Fargo: Purchase of $48.90 at TARGET with card ending 3319"
    // - "Truist Alert: A $15.99 transaction at NETFLIX was posted to account 6104"
    // - "Zelle: You received $150.00 from Carlos" / "Recibiste $150.00"
    const amountMatch = line.match(/\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/);
    if (amountMatch) {
      const parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        const isIncome =
          /received|deposit|direct deposit|payroll|recibiste|depósito|abono|refund|transfer from/i.test(
            line
          );
        const type: 'expense' | 'income' = isIncome ? 'income' : 'expense';

        // Extraer nombre del comercio después de "at ", "with ", "to ", "from ", "en "
        let merchant = 'Movimiento Bancario';
        const merchMatch = line.match(
          /(?:at|with|to|from|en|comercio)\s+([A-Za-z0-9\s.&'-]{2,30}?)(?:\s+on\b|\s+with\b|\s+for\b|\s+card\b|\s+ending\b|\s+account\b|\.|,|$)/i
        );
        if (merchMatch && merchMatch[1]) {
          merchant = merchMatch[1].trim();
        } else {
          // Si el usuario escribió por ejemplo: "Walmart $45.20" o "$19.99 Steam"
          const stripped = line
            .replace(amountMatch[0], '')
            .replace(/chase|wells fargo|truist|alert|notification|purchase|transaction|of|:|-/gi, '')
            .trim();
          if (stripped.length >= 2) {
            merchant = stripped.slice(0, 35);
          }
        }

        // Detectar pista de banco o últimos 4 dígitos
        let bankHint: string | undefined;
        const maskMatch = line.match(/(?:ending in|ending|cuenta|card|•••|\.\.\.)\s*(\d{4})/i);
        if (maskMatch) {
          bankHint = maskMatch[1];
        } else if (/wells\s*fargo/i.test(line)) {
          bankHint = 'wells';
        } else if (/chase/i.test(line)) {
          bankHint = 'chase';
        } else if (/truist/i.test(line)) {
          bankHint = 'truist';
        }

        results.push({
          description: merchant,
          merchantName: merchant,
          amount: parsedAmount,
          type,
          date: today,
          categoryId: autoDetectCategoryId(`${merchant} ${line}`, type),
          detectedBankHint: bankHint,
        });
      }
    }
  }

  return results;
}

/**
 * Busca la cuenta del usuario (Wells Fargo, Chase, Truist) que coincida con la alerta
 */
export function matchAccountForAlert(
  accounts: BankAccount[],
  hint?: string,
  fallbackAccountId?: string
): string {
  if (accounts.length === 0) return '';
  if (hint) {
    const byMask = accounts.find((a) => a.mask === hint);
    if (byMask) return byMask.id;

    const lowerHint = hint.toLowerCase();
    const byInst = accounts.find(
      (a) =>
        a.institution.toLowerCase().includes(lowerHint) ||
        a.name.toLowerCase().includes(lowerHint)
    );
    if (byInst) return byInst.id;
  }
  return fallbackAccountId || accounts[0].id;
}
