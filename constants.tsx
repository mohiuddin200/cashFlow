
import React from 'react';
import { Category, Currency } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', icon: '🍔', color: 'bg-orange-500', type: 'expense' },
  { id: '2', name: 'Transport', icon: '🚗', color: 'bg-blue-500', type: 'expense' },
  { id: '3', name: 'Rent', icon: '🏠', color: 'bg-indigo-500', type: 'expense' },
  { id: '4', name: 'Shopping', icon: '🛍️', color: 'bg-pink-500', type: 'expense' },
  { id: '5', name: 'Entertainment', icon: '🎬', color: 'bg-purple-500', type: 'expense' },
  { id: '6', name: 'Salary', icon: '💰', color: 'bg-green-500', type: 'income' },
  { id: '7', name: 'Freelance', icon: '💻', color: 'bg-emerald-500', type: 'income' },
  { id: '8', name: 'Gift', icon: '🎁', color: 'bg-yellow-500', type: 'income' },
  { id: '9', name: 'Health', icon: '🏥', color: 'bg-red-500', type: 'expense' },
  { id: '10', name: 'Utility', icon: '⚡', color: 'bg-cyan-500', type: 'expense' },
];

export const STORAGE_KEY = 'cashflow_data_v1';

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' }
];

export const DEFAULT_CURRENCY = 'USD';
