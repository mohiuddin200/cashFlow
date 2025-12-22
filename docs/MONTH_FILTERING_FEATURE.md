# Month-Based Filtering Feature

## Overview

The Month-Based Filtering feature allows you to view your financial data for specific months, making it easier to track your spending patterns and budget over time. You can navigate between different months and choose whether to carry forward your remaining balance from one month to the next.

## Features

### 1. Month Selector

Located at the top of the Dashboard, the month selector lets you navigate through your transaction history.

**How it works:**
- Use the **left arrow (←)** to view previous months
- Use the **right arrow (→)** to view more recent months
- The center displays the currently selected month (e.g., "December 2025")
- A "With carry-forward" badge appears when the feature is enabled

**Limitations:**
- Only past and current months are available
- Future months cannot be selected

### 2. Month-Filtered Data

When you select a month, the following data updates to show only that month's information:

- **Total Balance** - Your balance for the selected month
- **Monthly Income** - Income transactions in the selected month
- **Monthly Spent** - Expense transactions in the selected month
- **Daily Limit Left** - Recalculated based on the selected month's remaining days
- **Recent Transactions** - Shows only transactions from the selected month
- **History Tab** - Transaction list filters to show only the selected month's transactions

### 3. Carry-Forward Setting

The carry-forward setting determines how your balance is calculated when viewing different months.

#### When Carry-Forward is ENABLED (default):
- Each month starts with the previous month's remaining balance
- Your balance includes: `previous cumulative balance + (current month income - expenses)`
- This creates a continuous running balance across all months

**Example:**
```
January: Income $5000, Expenses $3000 = $2000 remaining
February: Starts with $2000 + Income $4000, Expenses $3500 = $2500 balance
```

#### When Carry-Forward is DISABLED:
- Each month starts fresh from zero
- Your balance includes only: `current month income - expenses`
- Each month is treated independently

**Example:**
```
January: Income $5000, Expenses $3000 = $2000 balance for January only
February: Fresh start - Income $4000, Expenses $3500 = $500 balance for February
```

## How to Access

### Change Month
1. Go to the **Dashboard** tab
2. Use the arrow buttons in the month selector at the top
3. View your data for the selected month

### Change Carry-Forward Setting
1. Tap your profile picture in the top-right corner
2. Scroll to **"Month Settings"**
3. Tap to open the settings modal
4. Toggle the **"Carry-forward Balance"** switch
5. Tap **"Done"** to save

## Data Connection Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    App State (App.tsx)                  │
├─────────────────────────────────────────────────────────┤
│  • selectedMonth        - Currently selected month       │
│  • carryForwardEnabled  - Toggle setting from Firebase  │
│  • transactions         - All transactions from Firebase │
│  • loans                - Loan data from Firebase        │
└──────────────┬──────────────────────────────────────────┘
               │
               │ Month Calculations
               ▼
┌─────────────────────────────────────────────────────────┐
│            Month Calculations Utility                    │
│         (utils/monthCalculations.ts)                     │
├─────────────────────────────────────────────────────────┤
│  • Filters transactions by selected month               │
│  • Calculates balance based on carry-forward setting    │
│  • Returns: balance, income, expenses, net              │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│  Dashboard   │  │ Transaction  │
│              │  │    List      │
├──────────────┤  ├──────────────┤
│ • Month      │  │ • Filtered   │
│   Selector   │  │   by month   │
│ • Balance    │  │              │
│ • Stats      │  │              │
│ • Recent     │  │              │
│   Txns       │  │              │
└──────────────┘  └──────────────┘
```

## Settings Storage

The carry-forward setting is stored in your Firebase user document:

```javascript
users/{userId}/
  - email: "user@example.com"
  - spendingGoal: 20000
  - currency: "BDT"
  - carryForwardEnabled: true  ← New setting
  - createdAt: timestamp
  - updatedAt: timestamp
```

This means:
- The setting syncs across all your devices
- It persists when you close and reopen the app
- Existing users get the feature enabled by default

## Use Cases

### Scenario 1: Track Monthly Budget Reset
If you want each month to be independent (fresh start each month):
1. Open **Month Settings**
2. **Disable** carry-forward
3. Each month now shows only that month's income and expenses

### Scenario 2: Track Cumulative Savings
If you want to see your running balance grow over time:
1. Open **Month Settings**
2. **Enable** carry-forward
3. Each month shows your total accumulated balance

### Scenario 3: Compare Month-over-Month Spending
1. Navigate between months using the month selector
2. View the "Monthly Spent" amount for each month
3. Compare spending patterns across different months

## Notes

- Loans that are "connected to money" are included in balance calculations
- The month selector only shows months where you have transactions, plus the current month
- When carry-forward is disabled, the balance shown is only for that specific month
- When carry-forward is enabled, the balance includes all previous months' cumulative data
