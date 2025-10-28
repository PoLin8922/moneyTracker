# GitHub Copilot Instructions for MoneyTracker

## Project Overview

MoneyTracker is a comprehensive personal finance management application designed for Taiwanese users. It provides features for asset tracking, cash flow planning, ledger management, investment portfolio monitoring, and savings jar functionality.

### Technology Stack

- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS, Radix UI components
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **UI Components**: Radix UI with custom styling
- **Build Tool**: Vite + esbuild
- **Type System**: TypeScript 5.6+

### Architecture

This is a monorepo with three main directories:
- `client/`: React frontend application
- `server/`: Express backend API
- `shared/`: Shared TypeScript types and schemas (Drizzle schema)

Path aliases:
- `@/`: Points to `client/src/`
- `@shared/`: Points to `shared/`
- `@assets/`: Points to `attached_assets/`

## Core Features

1. **Asset Overview**: Track net worth across multiple accounts with different currencies
2. **Cash Flow Planner**: Budget management with category-based allocation
3. **Ledger**: Transaction recording with unified category management
4. **Investment Portfolio**: Track stocks, funds, and investment performance
5. **Savings Jars**: Goal-based savings with category allocation

## Coding Standards and Conventions

### General Principles

1. **Minimal Changes**: Always make the smallest possible changes to achieve the goal
2. **Configuration Centralization**: All configuration must be defined in `server/config.ts` and imported from there
3. **Type Safety**: Use TypeScript strictly - no `any` types without good reason
4. **Consistent Naming**: Follow the naming conventions defined in `NAMING_CONVENTIONS.md`

### Naming Conventions

- **Database Tables**: Use snake_case (e.g., `user_sessions`, `asset_accounts`, `ledger_categories`)
- **TypeScript Variables**: Use camelCase (e.g., `userId`, `assetAccount`, `ledgerCategory`)
- **React Components**: Use PascalCase (e.g., `AssetOverview`, `CashFlowPlanner`)
- **Files**: 
  - Components: PascalCase (e.g., `AssetTrendChart.tsx`)
  - Utilities: camelCase (e.g., `exchangeRates.ts`)
- **CSS Classes**: Use Tailwind utilities; custom classes use kebab-case

### Configuration Management

**Critical**: All configuration values must be centralized in `server/config.ts`:

- Session configuration (table name, cookie name, TTL, secret)
- CORS settings
- Environment variables
- Database connection settings

**Never hardcode configuration values in multiple files.** Always import from `server/config.ts`:

```typescript
import { SESSION_CONFIG, ENV, CORS_CONFIG } from "./config";
```

### Database Schema

- Primary database schema is defined in `shared/schema.ts` using Drizzle ORM
- All tables use `gen_random_uuid()` for ID generation
- Foreign keys include `onDelete: 'cascade'` for user data
- Use Drizzle's type inference: `typeof tableName.$inferSelect` and `typeof tableName.$inferInsert`
- Validation schemas use `drizzle-zod`'s `createInsertSchema()`

### API Conventions

- REST endpoints follow pattern: `/api/resource-name`
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return consistent JSON responses
- Error responses include descriptive messages
- Authentication required for all user-specific routes

### React Component Patterns

- Use functional components with hooks
- Prefer React Query (`@tanstack/react-query`) for server state
- Use Radix UI components for UI primitives
- Style with Tailwind CSS utilities
- Keep components focused and single-responsibility
- Extract reusable logic into custom hooks (in `client/src/hooks/`)

### State Management

- **Server State**: Use TanStack Query (React Query)
  - Queries for read operations
  - Mutations for write operations
  - Automatic caching and revalidation
- **Client State**: Use React hooks (useState, useReducer)
- **Form State**: Use react-hook-form with zod validation

## Development Workflow

### Running the Application

```bash
# Development mode (client + server)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run check

# Database migrations
npm run db:push
```

### Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `SESSION_SECRET`: Secret for session encryption
- `NODE_ENV`: `development` or `production`
- `FRONTEND_URL`: Frontend URL for CORS (production only)

**Never commit `.env` files.** Only `.env.example` should be in version control.

### Database Migrations

- Migrations are stored in `migrations/` directory
- Use Drizzle Kit for schema changes: `npm run db:push`
- For data migrations, create numbered SQL files (e.g., `0003_step1_create_table.sql`)
- Always test migrations on development database first
- Document migration steps in relevant markdown files (e.g., `MIGRATION_GUIDE.md`)

## Testing

### Testing Approach

This project uses manual testing workflows documented in `TESTING_GUIDE.md`. 

When making changes:
1. Follow the testing checklist in `TESTING_GUIDE.md`
2. Test across all affected features (Asset Overview, Cash Flow, Ledger, Investment, Savings Jars)
3. Verify database changes don't break existing data
4. Test both light and dark modes
5. Check responsive design on mobile viewport

### Quality Checks

Before committing:
1. Run `npm run check` for TypeScript validation
2. Ensure the application builds successfully
3. Test affected features manually
4. Check browser console for errors
5. Verify no ESLint warnings in changed files

## Security Considerations

1. **Session Management**: 
   - Sessions stored in PostgreSQL (`user_sessions` table)
   - Use centralized `SESSION_CONFIG` from `server/config.ts`
   - Session TTL: 30 days
   
2. **Authentication**:
   - Supports both Replit Auth and simple email/password auth
   - All user data includes `userId` foreign key with cascade delete
   
3. **Input Validation**:
   - Use Zod schemas for all API inputs
   - Validate on both client and server
   - Sanitize user inputs

4. **SQL Injection Prevention**:
   - Use Drizzle ORM parameterized queries
   - Never concatenate user input into SQL strings

5. **Environment Variables**:
   - Never commit secrets to version control
   - Use `.env` for local development (gitignored)
   - Set environment variables in deployment platform

## UI/UX Guidelines

### Design System

Follow the design guidelines in `design_guidelines.md`:

1. **Color Palette**: 
   - Primary Blue: `hsl(220 88% 63%)` - `#4C7EF3`
   - Accent Navy: `hsl(215 25% 29%)` - `#3A506B`
   - Success Green: `hsl(142 76% 36%)`
   - Error Red: `hsl(0 84% 60%)`

2. **Typography**:
   - Font: 'Noto Sans TC', system fonts
   - Type scale: text-xs (12px) to text-5xl (48px)
   - Font weights: medium, semibold, bold

3. **Spacing**: Use Tailwind spacing units (p-4, p-6, gap-6, gap-8)

4. **Components**:
   - Rounded corners: `rounded-xl` (12px)
   - Cards: white background (light) with `shadow-sm`
   - Buttons: Primary uses `bg-primary` with white text

5. **Responsiveness**:
   - Mobile-first approach
   - Use Tailwind breakpoints: `md:`, `lg:`
   - Bottom navigation on mobile

### Taiwan-Specific Features

- **Currency**: Display NT$, US$, ¥ with proper symbols
- **Number Formatting**: Use comma separators (12,345.67)
- **Date Format**: YYYY/MM/DD (Taiwan standard)
- **Language**: Support Traditional Chinese (zh-TW)
- **Local Banks**: Support CTBC, Cathay, Firstrade logos

## Common Patterns and Best Practices

### Fetching Data

```typescript
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, error } = useQuery({
  queryKey: ["resource-name", userId],
  queryFn: async () => {
    const res = await fetch("/api/resource-name");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
});
```

### Mutating Data

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch("/api/resource-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create");
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["resource-name"] });
  },
});
```

### Database Queries (Server)

```typescript
import { db } from "./db";
import { tableName } from "@shared/schema";
import { eq } from "drizzle-orm";

// Select
const items = await db.select().from(tableName).where(eq(tableName.userId, userId));

// Insert
const [newItem] = await db.insert(tableName).values(data).returning();

// Update
await db.update(tableName).set(data).where(eq(tableName.id, id));

// Delete
await db.delete(tableName).where(eq(tableName.id, id));
```

### Form Handling

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive(),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", amount: 0 },
});

const onSubmit = form.handleSubmit(async (data) => {
  await mutation.mutateAsync(data);
});
```

## Unified Category System

The application uses a unified category management system (`ledger_categories` table) shared across:
- Ledger transactions (income/expense)
- Cash flow planning (budget categories)
- Savings jars (allocation categories)

**Important**: When working with categories:
1. Categories have `type` field: "income" or "expense"
2. Categories include `icon_name` (Lucide icon name) and `color` (hex)
3. Each user has their own set of categories
4. Default categories are created on user registration
5. Categories can be managed through the Category Management dialog

## File Organization

```
moneyTracker/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── App.tsx        # Main app component with routing
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                 # Backend application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── db.ts              # Database connection
│   ├── config.ts          # Centralized configuration
│   ├── simpleAuth.ts      # Simple authentication
│   └── replitAuth.ts      # Replit authentication
├── shared/                 # Shared code
│   └── schema.ts          # Drizzle schema and types
├── migrations/             # Database migrations
└── attached_assets/        # Static assets
```

## Documentation

Key documentation files:
- `design_guidelines.md`: UI/UX design system
- `NAMING_CONVENTIONS.md`: Configuration and naming standards
- `TESTING_GUIDE.md`: Manual testing procedures
- `LOCAL_DEV_SETUP.md`: Local development setup guide
- `MIGRATION_GUIDE.md`: Database migration instructions
- Various feature-specific guides (e.g., `INVESTMENT_GUIDE.md`)

## Common Issues and Solutions

### Issue: Database Connection Errors
- Verify `DATABASE_URL` is set correctly in `.env`
- Check Neon database is accessible
- Ensure `user_sessions` table exists (run `setup-session-table.sql`)

### Issue: Session Not Persisting
- Verify configuration uses `SESSION_CONFIG` from `server/config.ts`
- Check `user_sessions` table has correct schema
- Ensure cookie name matches across all files
- Verify `SESSION_SECRET` environment variable is set

### Issue: Category Not Syncing
- Verify all systems query `ledger_categories` table
- Check user_id is correctly set on categories
- Ensure type filter is applied (income vs expense)

### Issue: TypeScript Errors
- Run `npm run check` to see all errors
- Verify imports use correct path aliases (@/, @shared/)
- Check Drizzle types are generated correctly

## Development Tips

1. **Start Small**: Make minimal, focused changes
2. **Test Early**: Test changes as soon as possible after making them
3. **Use Types**: Leverage TypeScript for compile-time safety
4. **Follow Patterns**: Look at existing code for patterns to follow
5. **Centralize Config**: Always use `server/config.ts` for configuration
6. **Document Changes**: Update relevant documentation when changing features
7. **Respect Existing Code**: Don't modify working code unless necessary
8. **Mobile First**: Always consider mobile viewport in UI changes
9. **Dark Mode**: Test both light and dark modes for UI changes
10. **Localization**: Remember Traditional Chinese language support

## When in Doubt

1. Check existing similar code in the codebase
2. Refer to the design guidelines for UI decisions
3. Follow the naming conventions document strictly
4. Test changes with the testing guide checklist
5. Keep changes minimal and focused

## External Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
