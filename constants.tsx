
import React from 'react';
import { Category } from './types';

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
