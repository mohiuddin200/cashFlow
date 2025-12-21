# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- `npm run dev` - Start the development server (runs on port 3000, host 0.0.0.0)
- `npm run build` - Build the production application
- `npm run preview` - Preview the production build

### Environment Setup
- Create a `.env.local` file with your `GEMINI_API_KEY` for AI features
- The Vite config automatically loads environment variables and makes `GEMINI_API_KEY` available

### Firebase Deployment
- The app is configured for Firebase Hosting
- Build output goes to `dist/` directory
- Use `firebase deploy` to deploy (requires Firebase CLI setup)

## Architecture Overview

### Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with mobile-first design
- **Backend**: Firebase (Authentication + Firestore)
- **AI**: Google Gemini API for financial insights
- **Charts**: Recharts for data visualization

### Core Architecture

**Single Page Application Structure:**
- Mobile-first PWA design with bottom navigation
- Tab-based routing handled by state in `App.tsx`
- Real-time data sync with Firestore
- Component-based architecture with clear separation of concerns

**Key Files:**
- `App.tsx` - Main application container with state management and tab navigation
- `types.ts` - TypeScript interfaces for Transaction, Category, and app state
- `services/firebase.ts` - Firebase configuration and service exports
- `constants.tsx` - Default categories and app constants

### Data Flow

**State Management:**
- Centralized in `App.tsx` using React hooks
- Real-time Firestore listeners sync data automatically
- Local state updates trigger Firestore writes
- No external state management library

**Core Data Models:**
```typescript
Transaction: { id, amount, categoryId, date, note, type }
Category: { id, name, icon, color, type } // type: 'income' | 'expense'
```

**Authentication Flow:**
- Firebase Auth with Google sign-in and email/password
- User data stored in separate Firestore documents by UID
- Real-time sync starts after authentication

### Component Structure

**Main Views (tabs):**
1. **Home** (`Dashboard`) - Balance overview, spending goals, recent transactions
2. **History** (`TransactionList`) - Complete transaction history with edit/delete
3. **Add** (`TransactionForm`) - Add/edit transactions with category selection
4. **Categories** (`CategoryManager`) - Manage custom categories
5. **Insights** (`AIInsights`) - AI-powered financial analysis using Gemini
6. **Account** (`Account`) - User profile and settings

**Shared Patterns:**
- All components receive props, no global state access
- Consistent styling with Tailwind classes
- Mobile-optimized UI with safe area handling
- Form validation and error handling

### AI Integration

**Gemini API Usage:**
- Transaction parsing from natural language
- Financial insights and spending analysis
- API key configured via environment variable
- Error handling for API failures

### Firebase Configuration

**Firestore Structure:**
```
users/{userId}/
  - transactions: Transaction[]
  - categories: Category[]
  - spendingGoal: number
  - email: string
  - updatedAt: string
```

**Real-time Updates:**
- Uses `onSnapshot` for real-time data sync
- Automatic conflict resolution via last-write-wins
- Offline support with Firestore caching

### Mobile Optimization

**PWA Features:**
- Viewport meta tags for mobile rendering
- Safe area CSS classes for notched devices
- Touch-friendly UI elements
- Bottom navigation with floating action button

### Build Configuration

**Vite Setup:**
- React plugin for fast refresh
- Path aliases (`@/` for root directory)
- Environment variable injection
- Development server on 0.0.0.0:3000

**Tailwind CSS:**
- Mobile-first responsive design
- Custom color scheme (emerald primary)
- Component-friendly utility classes
- PostCSS with Autoprefixer