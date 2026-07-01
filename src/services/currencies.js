export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc (CHF)' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan (CNY)' }
];

export const getCurrencySymbol = (code) => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : '$';
};
