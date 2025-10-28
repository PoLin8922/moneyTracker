# MoneyTracker - GitHub Copilot Instructions

## Project Overview

MoneyTracker is a comprehensive personal finance management web application designed for Taiwanese users. It helps users track assets, manage budgets, record transactions in a ledger, and monitor investments. The application features a modern, iOS-optimized interface following Apple Human Interface Guidelines with Taiwan-specific localization.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Components**: 
  - Radix UI primitives
  - shadcn/ui components
  - Lucide React icons
- **Styling**: 
  - Tailwind CSS 4 (with @tailwindcss/vite)
  - Framer Motion for animations
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **Authentication**: 
  - Passport.js with local strategy
  - Replit Auth integration
  - Express Session with PostgreSQL store
- **Real-time**: WebSocket (ws library)
- **Currency**: Exchange rate API integration

### Development Tools
- **Package Manager**: npm
- **TypeScript**: v5.6.3
- **Code Execution**: tsx for development
- **Bundling**: esbuild for server, Vite for client

## Project Structure

```
moneyTracker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── config.ts          # Centralized configuration
│   ├── simpleAuth.ts      # Local authentication
│   ├── replitAuth.ts      # Replit authentication
│   ├── db.ts              # Database connection
│   └── storage.ts         # File storage utilities
├── shared/                 # Shared between client and server
│   └── schema.ts          # Database schema (Drizzle)
├── migrations/             # Database migrations
└── scripts/               # Utility scripts
```

## Key Features

1. **Asset Overview**: Track multiple accounts (cash, bank, investment, crypto) with trend visualization
2. **Cash Flow Planner**: Budget planning with category allocation
3. **Ledger**: Transaction recording with category management
4. **Investment Portfolio**: Track holdings, transactions, and P/L
5. **Savings Jars**: Goal-based savings with category allocation
6. **Multi-currency Support**: TWD, USD, JPY with exchange rates

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables:

- `users`: User accounts with preferences
- `sessions` / `user_sessions`: Session storage
- `asset_accounts`: User's financial accounts
- `asset_history`: Net worth tracking over time
- `budgets`: Monthly budget plans
- `budget_categories`: Budget category allocations
- `ledger_entries`: Transaction records
- `ledger_categories`: Unified category system (shared across features)
- `investments`: Investment holdings
- `investment_transactions`: Buy/sell records
- `savings_jars`: Savings goals
- `savings_jar_categories`: Goal category allocations

## Coding Conventions

### TypeScript
- **Strict mode enabled**: Always type variables, parameters, and return values
- **Path aliases**: 
  - `@/*` maps to `./client/src/*`
  - `@shared/*` maps to `./shared/*`
- **Module system**: ESNext modules (use `import`/`export`)
- **Avoid `any`**: Use proper types or `unknown` with type guards

### Naming
- **Files**: kebab-case for files (`asset-accounts.tsx`)
- **Components**: PascalCase (`AssetAccount`)
- **Functions/Variables**: camelCase (`getUserAssets`)
- **Constants**: UPPER_SNAKE_CASE for config (`SESSION_CONFIG`)
- **Database columns**: snake_case (`user_id`, `created_at`)

### React Components
- Use functional components with hooks
- Prefer named exports for components
- Keep components focused and single-responsibility
- Use TypeScript interfaces for props
- Extract reusable logic into custom hooks

### API Routes
- RESTful conventions: GET, POST, PUT, DELETE
- Return consistent response formats
- Always include error handling with appropriate status codes
- Use Zod schemas for request validation

### Configuration Management
**CRITICAL**: All configuration must be centralized in `server/config.ts`

- **DO NOT** hardcode configuration values in multiple files
- **ALWAYS** import from `SESSION_CONFIG`, `ENV`, `CORS_CONFIG`
- Common pitfalls to avoid:
  - Multiple session table names (must be `user_sessions`)
  - Inconsistent cookie names (must be `SESSION_CONFIG.COOKIE_NAME`)
  - Hardcoded TTL values
  - Direct use of `process.env` outside config.ts

See `NAMING_CONVENTIONS.md` for detailed guidelines.

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with DATABASE_URL and SESSION_SECRET

# Run database migrations (if needed)
npm run db:push

# Start development server
npm run dev
```

### Build
```bash
# Build client and server
npm run build

# Or separately:
npm run build:client
npm run build:server
```

### Type Checking
```bash
npm run check
```

## Design Guidelines

Follow the Apple Human Interface Guidelines with Taiwan localization:

### Colors
- **Primary**: Blue (#4C7EF3 / hsl(220, 88%, 63%))
- **Accent**: Navy (#3A506B)
- **Background**: Light (#F7F8FA) / Dark (#1A1A1A)
- **Success**: Green (profits)
- **Error**: Red (losses)

### Typography
- **Fonts**: 'Noto Sans TC', 'PingFang TC', system fonts
- **Sizes**: text-base (16px) for body, text-lg (18px) for titles
- **Chinese Support**: Always test with Traditional Chinese characters (繁體中文)

### Spacing
- Use Tailwind spacing units: 2, 3, 4, 6, 8, 12, 16, 24
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8

### Components
- Rounded corners: rounded-xl (12px) for cards
- Shadows: shadow-sm in light mode, borders in dark mode
- Icons: 48px for category icons, lucide-react for UI

See `design_guidelines.md` for comprehensive design specifications.

## Testing

Currently, the project uses manual testing. See `TESTING_GUIDE.md` (in Traditional Chinese) for:
- Feature testing checklists
- Category management testing
- Cross-system integration tests
- Edge case scenarios

**When adding new features**: Create corresponding test cases following the existing format.

## Localization

### Language
- **Primary**: Traditional Chinese (zh-TW)
- **Secondary**: English for code/comments
- UI text should be in Traditional Chinese
- Error messages should be user-friendly in Chinese

### Number Formatting
- Comma separators: 12,345.67
- Currency symbols: NT$ (TWD), US$ (USD), ¥ (JPY)
- Date format: YYYY/MM/DD (ISO with slashes)

### Cultural Considerations
- Use Taiwan-specific bank names (CTBC, Cathay)
- Piggy bank (存錢罐) metaphor for savings
- Red for losses (opposite of Western convention where red = danger)

## Common Patterns

### Database Queries
```typescript
import { db } from './db';
import { assetAccounts } from '@shared/schema';

// Always filter by userId for data isolation
const accounts = await db
  .select()
  .from(assetAccounts)
  .where(eq(assetAccounts.userId, userId));
```

### API Error Handling
```typescript
try {
  // operation
  res.json({ success: true, data });
} catch (error) {
  console.error('[API Error]', error);
  res.status(500).json({ 
    success: false, 
    message: '操作失敗，請稍後再試' 
  });
}
```

### Form Validation
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  amount: z.number().positive('金額必須大於零'),
  category: z.string().min(1, '請選擇類別'),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

## Security Considerations

- **Authentication**: Always check `req.user` before accessing user data
- **SQL Injection**: Use parameterized queries via Drizzle ORM (never string concatenation)
- **Session Management**: Use `SESSION_CONFIG` constants for consistency
- **CORS**: Properly configured for Vercel frontend and Replit domains
- **Environment Variables**: Never commit `.env` files (use `.env.example`)
- **User Data Isolation**: Always filter by `userId` in database queries

## Deployment

### Platforms
- **Backend**: Render.com or Replit
- **Frontend**: Vercel
- **Database**: Neon (PostgreSQL)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Random secret key for sessions
- `FRONTEND_URL`: Frontend URL for CORS
- `NODE_ENV`: `production` or `development`
- `REPLIT_DOMAINS`: (optional) For Replit auth

## Troubleshooting

### Common Issues

1. **"伺服器回應格式錯誤"** (Server response format error)
   - Check DATABASE_URL is set
   - Verify `ledger_categories` table exists
   - Check server logs for connection errors

2. **Session/Auth Problems**
   - Ensure `user_sessions` table exists (run `setup-session-table.sql`)
   - Verify SESSION_SECRET is set
   - Check cookie domain settings for cross-origin

3. **Category Not Syncing**
   - Categories are now unified in `ledger_categories` table
   - All features (ledger, budget, savings) share the same categories
   - Check user_id matches in queries

See `TROUBLESHOOTING.md` and `LOCAL_DEV_SETUP.md` for detailed guides.

## Important Notes for AI Assistants

1. **Configuration First**: Before making changes involving sessions, cookies, or CORS, review `server/config.ts` and `NAMING_CONVENTIONS.md`

2. **Type Safety**: This project uses strict TypeScript. Always provide proper types and avoid `any`

3. **Chinese UI**: Remember that UI text should be in Traditional Chinese. Ask for translations if unsure.

4. **Database Changes**: Use Drizzle schema definitions in `shared/schema.ts`. Generate migrations with `npm run db:push`

5. **User Context**: Almost all operations require a user context. Check authentication middleware and pass `userId` appropriately

6. **Minimal Changes**: When fixing issues, make surgical changes. Don't refactor unrelated code.

7. **Testing**: Manually test changes across features since automated tests are limited

8. **Documentation**: Update relevant `.md` files when making significant changes

## Additional Resources

- Design guidelines: `design_guidelines.md`
- Testing checklist: `TESTING_GUIDE.md` (Traditional Chinese)
- Local setup: `LOCAL_DEV_SETUP.md` (Traditional Chinese)
- Naming conventions: `NAMING_CONVENTIONS.md` (Traditional Chinese)
- Investment setup: `INVESTMENT_GUIDE.md`
- Migration guides: Various `*_GUIDE.md` files

## Contact & Contribution

When contributing to this repository:
- Follow existing code patterns
- Maintain type safety
- Keep UI text in Traditional Chinese
- Test thoroughly across features
- Update documentation as needed
- Reference the appropriate guide documents for context
