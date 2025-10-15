# MoneyTrack - Personal Finance Management App

## Overview

MoneyTrack (錢跡) is a modern personal finance application designed specifically for Taiwanese users. The app helps users track their complete financial picture - from income and expenses to investments - using visual dashboards and intelligent cash flow planning. Built with a mobile-first approach following Apple Human Interface Guidelines, the application provides an intuitive experience for managing assets, budgeting, transaction tracking, and investment portfolios.

## Recent Changes (October 2025)

**Asset Account Management Refactor (Latest)**
- Split account management into two dialogs: AddAccountDialog (new accounts) and AccountDetailDialog (view/edit existing)
- AccountDetailDialog displays comprehensive account information with tabbed interface
- Transaction history view shows all ledger entries linked to the account with balance progression
- Balance adjustment feature: directly adjust account balance and auto-create "餘額調整" ledger entry
- Moved transfer and add account buttons from header to asset detail table section
- API enhancement: /api/ledger endpoint now supports accountId query parameter for filtering
- Fixed "上月額外收入" duplicate creation by using `open` state dependency in useEffect

**Budget Items Refactor**
- Converted fixed income/expense/extra income from single values to item-based lists
- Created budgetItems database table with CRUD operations
- Budget items stored as separate records (type: fixed_income/fixed_expense/extra_income) with name and amount
- Fixed income/expense now accessible via clickable cards that open item management dialogs
- Extra income includes auto-calculated "上月額外收入" = max(0, last month income - current month fixed expense)
- Auto-calculated items cannot be deleted but update automatically
- Total disposable income calculated as sum of all category allocations for accuracy
- Enhanced UX: click to view/manage detailed budget items instead of single editable values

**Savings Jar Feature Implementation**
- Added comprehensive savings jar system with goal tracking and progress visualization
- Savings jars can be optionally included in disposable income calculations via `includeInDisposable` flag
- Deposit tracking from asset accounts without affecting account balances
- Category allocation within savings jars with customizable percentages and colors
- Jar categories automatically appear in monthly category allocation chart when jar is enabled
- Smart color matching: jar categories with same name as budget categories use matching colors
- Animated progress display with framer-motion

**Cash Flow Calculation Enhancement**
- Extra income automatically calculated as: max(0, previous month income - current month fixed expenses)
- Extra disposable income equals extra income (not affected by savings jars)
- Savings jar categories can be included in monthly allocation chart when `includeInDisposable` is enabled

**Ledger Historical Trends**
- Added disposable income history trend dialog in ledger page
- Two separate charts: one for monthly disposable income, one for monthly remaining balance
- Interactive visualizations with historical data table
- Accessible by clicking on disposable income or remaining disposable income cards

**UI/UX Improvements**
- Enhanced budget usage charts with stronger visual contrast (15% opacity for unused, saturated gradients for used)
- Red overspending warnings when budget category usage exceeds allocation
- Asset trend chart with complete time series and proper monthly/daily scaling
- Improved carousel navigation in ledger statistics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & UI Components**
- React with TypeScript as the core framework
- Vite for build tooling and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom Taiwan-localized design tokens
- Framer Motion for animations (piggy bank icon and transitions)
- Recharts for data visualization (trends, pie charts, allocation charts)

**State Management**
- TanStack Query (React Query) for server state management and caching
- React hooks for local component state
- Custom hooks for data operations (useAssets, useBudget, useLedger, etc.)

**Design System**
- Custom color palette optimized for both light and dark modes
- Primary Blue (220 88% 63%) for actions and key metrics
- Accent Navy (215 25% 29%) for headers and emphasis
- Typography using Noto Sans TC and PingFang TC for Chinese localization
- Consistent spacing and elevation system for cards and interactions

### Backend Architecture

**Server Framework**
- Express.js running on Node.js
- TypeScript for type safety across the full stack
- RESTful API design pattern
- Session-based authentication using Replit Auth (OpenID Connect)

**Database & ORM**
- PostgreSQL via Neon serverless database
- Drizzle ORM for type-safe database queries
- Schema-first design with Zod validation
- Database migrations managed through Drizzle Kit

**Data Models**
- Users: Profile and preferences
- Asset Accounts: Multi-currency account management with exchange rates
- Asset History: Time-series data for net worth tracking
- Budgets: Monthly budget planning with fixed and variable income/expenses
- Budget Categories: Customizable allocation categories with percentages
- Budget Items: Individual income/expense items (type: fixed_income/fixed_expense/extra_income) with name, amount, and auto-calculation flag
- Ledger Entries: Transaction records with categorization
- Investment Holdings & Transactions: Portfolio tracking
- Savings Jars: Goal-based savings with progress tracking and category allocation
- Savings Jar Categories: Allocation breakdown for savings goals
- Savings Jar Deposits: Deposit records from asset accounts (non-deductive)

**Session Management**
- PostgreSQL-backed sessions using connect-pg-simple
- HTTP-only secure cookies
- 7-day session TTL
- CSRF protection through session secrets

### API Architecture

**Authentication Endpoints**
- `/api/login` - Initiates OpenID Connect flow
- `/api/callback` - OAuth callback handler
- `/api/auth/user` - Current user session retrieval
- `/api/logout` - Session termination

**Resource Endpoints**
- `/api/assets` - CRUD operations for asset accounts
- `/api/asset-history` - Historical net worth data
- `/api/budgets/:month` - Monthly budget retrieval and management
- `/api/budgets/:month/previous-income` - Previous month income calculation
- `/api/budgets/history/disposable-income` - Historical disposable income trends
- `/api/budgets/:id/categories` - Budget category allocation
- `/api/budgets/:budgetId/items` - Budget items CRUD operations
- `/api/budgets/items/:id` - Individual budget item update/delete
- `/api/ledger` - Transaction entry management
- `/api/transfer` - Inter-account transfers
- `/api/exchange-rates` - Real-time currency conversion
- `/api/savings-jars` - CRUD operations for savings jars
- `/api/savings-jars/:id/categories` - Savings jar category allocation
- `/api/savings-jars/:id/deposits` - Savings jar deposit records

**Data Flow Pattern**
1. Frontend components use custom hooks (useAssets, useBudget, etc.)
2. Hooks leverage TanStack Query for caching and optimistic updates
3. API requests go through centralized apiRequest function with error handling
4. Server validates input using Zod schemas derived from Drizzle models
5. Storage layer abstracts database operations via IStorage interface
6. Responses are cached and invalidated based on mutation success

### External Dependencies

**Third-Party Services**
- Replit Authentication (OpenID Connect) - User authentication and session management
- Neon Database - Serverless PostgreSQL hosting
- Open Exchange Rates API (exchangerate-api.com) - Real-time currency conversion with 1-hour caching

**Key Libraries**
- @neondatabase/serverless - WebSocket-based PostgreSQL client
- drizzle-orm & drizzle-zod - Type-safe ORM and validation
- @tanstack/react-query - Async state management
- @radix-ui/* - Accessible UI primitives (20+ components)
- react-hook-form with @hookform/resolvers - Form validation
- date-fns - Date manipulation and formatting
- recharts - Chart visualization
- framer-motion - Animation library
- openid-client & passport - OAuth/OIDC implementation
- express-session & connect-pg-simple - Session management

**Development Tools**
- TypeScript compiler with strict mode
- ESBuild for server bundling
- Vite plugins for development (runtime error overlay, cartographer, dev banner)
- PostCSS with Tailwind and Autoprefixer

**Asset Management**
- Custom exchange rate service with local caching
- Automatic TWD conversion for multi-currency support
- Support for 7 currencies (TWD, USD, JPY, EUR, GBP, CNY, HKD)
- Manual exchange rate override capability