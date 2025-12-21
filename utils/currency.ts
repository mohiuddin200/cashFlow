export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const locale = 'en-IN';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(amount);
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(1);
  const symbol = formatted.replace(/[0-9.,\s]/g, '');
  return symbol || currencyCode;
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