/**
 * Converts a numeric amount to Spanish currency words
 * e.g. 4520.00 -> "CUATRO MIL QUINIENTOS VEINTE PESOS 00/100 M.N."
 */
export function numberToWords(amount: number, currency: string = 'MXN'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'CERO PESOS 00/100 M.N.';
  }

  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  const cents = Math.round((absAmount - integerPart) * 100);
  const centsStr = cents.toString().padStart(2, '0') + '/100';

  let currencyName = 'PESOS';
  let currencySuffix = 'M.N.';

  if (currency === 'USD') {
    currencyName = integerPart === 1 ? 'DÓLAR' : 'DÓLARES';
    currencySuffix = 'USD';
  } else if (currency === 'EUR') {
    currencyName = integerPart === 1 ? 'EURO' : 'EUROS';
    currencySuffix = 'EUR';
  } else {
    currencyName = integerPart === 1 ? 'PESO' : 'PESOS';
  }

  const words = integerPart === 0 ? 'CERO' : convertGroup(integerPart);

  return `${words} ${currencyName} ${centsStr} ${currencySuffix}`.toUpperCase().trim();
}

function convertGroup(n: number): string {
  if (n === 0) return 'CERO';

  const units = [
    '',
    'UN',
    'DOS',
    'TRES',
    'CUATRO',
    'CINCO',
    'SEIS',
    'SIETE',
    'OCHO',
    'NUEVE',
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISÉIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
    'VEINTE',
    'VEINTIÚN',
    'VEINTIDÓS',
    'VEINTITRÉS',
    'VEINTICUATRO',
    'VEINTICINCO',
    'VEINTISÉIS',
    'VEINTISIETE',
    'VEINTIOCHO',
    'VEINTINUEVE',
  ];

  const tens = [
    '',
    '',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];

  const hundreds = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  function convertUnder1000(num: number): string {
    if (num === 0) return '';
    if (num === 100) return 'CIEN';

    let result = '';
    const h = Math.floor(num / 100);
    const remainder = num % 100;

    if (h > 0) {
      result += hundreds[h] + ' ';
    }

    if (remainder < 30) {
      result += units[remainder];
    } else {
      const t = Math.floor(remainder / 10);
      const u = remainder % 10;
      result += tens[t];
      if (u > 0) {
        result += ' Y ' + units[u];
      }
    }

    return result.trim();
  }

  // Billions / Millions / Thousands / Ones
  if (n >= 1000000000) {
    const billions = Math.floor(n / 1000000000);
    const remainder = n % 1000000000;
    const str = billions === 1 ? 'UN MIL MILLÓN' : convertGroup(billions) + ' MIL MILLONES';
    return (str + (remainder > 0 ? ' ' + convertGroup(remainder) : '')).trim();
  }

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    const remainder = n % 1000000;
    const str = millions === 1 ? 'UN MILLÓN' : convertGroup(millions) + ' MILLONES';
    return (str + (remainder > 0 ? ' ' + convertGroup(remainder) : '')).trim();
  }

  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    const str = thousands === 1 ? 'UN MIL' : convertUnder1000(thousands) + ' MIL';
    return (str + (remainder > 0 ? ' ' + convertUnder1000(remainder) : '')).trim();
  }

  return convertUnder1000(n);
}
