const LOCALE_MAP: { [key: string]: string } = {
  'USD': 'en-US',
  'EUR': 'de-DE',
  'GBP': 'en-GB',
  'JPY': 'ja-JP',
  'BDT': 'en-BD',
  'INR': 'en-IN',
  'TRY': 'tr-TR',
  'CAD': 'en-CA',
  'AUD': 'en-AU',
  'CHF': 'de-CH',
  'CNY': 'zh-CN',
  'PKR': 'en-PK',
  'SAR': 'ar-SA',
  'AED': 'ar-AE',
  'BRL': 'pt-BR',
  'RUB': 'ru-RU',
  'KRW': 'ko-KR',
  'SGD': 'en-SG',
  'MYR': 'en-MY',
  'THB': 'th-TH'
};

const SYMBOL_MAP: { [key: string]: string } = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'BDT': '৳',
  'INR': '₹',
  'TRY': '₺',
  'CAD': 'C$',
  'AUD': 'A$',
  'CHF': 'Fr',
  'CNY': '¥',
  'PKR': '₨',
  'SAR': '﷼',
  'AED': 'د.إ',
  'BRL': 'R$',
  'RUB': '₽',
  'KRW': '₩',
  'SGD': 'S$',
  'MYR': 'RM',
  'THB': '฿'
};

export const formatCurrency = (amount: number, currency: string = 'BDT'): string => {
  const locale = LOCALE_MAP[currency] || 'en-US';
  const symbol = SYMBOL_MAP[currency] || '$';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/[A-Z]{3}/, symbol);
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return SYMBOL_MAP[currencyCode] || currencyCode;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const locale = 'en-IN';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const locale = 'en-IN';
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
