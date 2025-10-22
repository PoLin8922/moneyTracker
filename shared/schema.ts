import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  integer,
  text,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  preferredCurrency: varchar("preferred_currency").default("TWD"),
  preferredLanguage: varchar("preferred_language").default("zh-TW"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Asset categories and accounts
export const assetAccounts = pgTable("asset_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // Account type - user can define custom types
  accountName: varchar("account_name").notNull(),
  note: text("note"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency").notNull().default("TWD"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1"),
  includeInTotal: varchar("include_in_total").notNull().default("true"), // "true" or "false"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAssetAccountSchema = createInsertSchema(assetAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAssetAccount = z.infer<typeof insertAssetAccountSchema>;
export type AssetAccount = typeof assetAccounts.$inferSelect;

// Asset history for trend tracking
export const assetHistory = pgTable("asset_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalNetWorth: decimal("total_net_worth", { precision: 15, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const insertAssetHistorySchema = createInsertSchema(assetHistory).omit({
  id: true,
  recordedAt: true,
});

export type InsertAssetHistory = z.infer<typeof insertAssetHistorySchema>;
export type AssetHistory = typeof assetHistory.$inferSelect;

// Budget planning
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  month: varchar("month").notNull(), // YYYY-MM format
  fixedIncome: decimal("fixed_income", { precision: 15, scale: 2 }).notNull().default("0"),
  fixedExpense: decimal("fixed_expense", { precision: 15, scale: 2 }).notNull().default("0"),
  extraIncome: decimal("extra_income", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// Budget categories
export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id").notNull().references(() => budgets.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  type: varchar("type").notNull().default("fixed"), // "fixed" or "extra"
  percentage: integer("percentage").notNull().default(0),
  color: varchar("color").notNull(),
  iconName: varchar("icon_name").default("Wallet"), // Icon identifier (optional for backward compatibility)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;

// Budget items (固定收支項目和額外收入項目)
export const budgetItems = pgTable("budget_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id").notNull().references(() => budgets.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // "fixed_income", "fixed_expense", or "extra_income"
  name: varchar("name").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  isAutoCalculated: varchar("is_auto_calculated").notNull().default("false"), // "true" for "上月額外收入"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
});

export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;

// Ledger entries
export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // income or expense
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: varchar("category").notNull(),
  accountId: varchar("account_id").references(() => assetAccounts.id, { onDelete: 'set null' }),
  date: date("date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;

// Investment holdings - 持倉記錄，關聯到券商帳戶
export const investmentHoldings = pgTable("investment_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  // 券商帳戶（台股、美股、加密貨幣帳戶）
  brokerAccountId: varchar("broker_account_id").notNull().references(() => assetAccounts.id, { onDelete: 'cascade' }),
  ticker: varchar("ticker").notNull(), // 股票代號或加密貨幣符號
  name: varchar("name").notNull(), // 標的名稱（如：台積電、Apple、Bitcoin）
  type: varchar("type").notNull(), // Taiwan Stocks, US Stocks, Crypto
  quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
  averageCost: decimal("average_cost", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvestmentHoldingSchema = createInsertSchema(investmentHoldings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvestmentHolding = z.infer<typeof insertInvestmentHoldingSchema>;
export type InvestmentHolding = typeof investmentHoldings.$inferSelect;

// Investment transactions
export const investmentTransactions = pgTable("investment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  holdingId: varchar("holding_id").notNull().references(() => investmentHoldings.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  // 付款帳戶（從哪個銀行帳戶扣款/入帳）
  paymentAccountId: varchar("payment_account_id").notNull().references(() => assetAccounts.id),
  // 券商帳戶（股票存入哪個券商帳戶）
  brokerAccountId: varchar("broker_account_id").notNull().references(() => assetAccounts.id),
  type: varchar("type").notNull(), // buy or sell
  quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
  pricePerShare: decimal("price_per_share", { precision: 15, scale: 2 }).notNull(),
  fees: decimal("fees", { precision: 15, scale: 2 }).default("0"),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvestmentTransactionSchema = createInsertSchema(investmentTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertInvestmentTransaction = z.infer<typeof insertInvestmentTransactionSchema>;
export type InvestmentTransaction = typeof investmentTransactions.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assetAccounts: many(assetAccounts),
  assetHistory: many(assetHistory),
  budgets: many(budgets),
  ledgerEntries: many(ledgerEntries),
  investmentHoldings: many(investmentHoldings),
  investmentTransactions: many(investmentTransactions),
  savingsJars: many(savingsJars),
}));

export const assetAccountsRelations = relations(assetAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [assetAccounts.userId],
    references: [users.id],
  }),
  ledgerEntries: many(ledgerEntries),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  categories: many(budgetCategories),
  items: many(budgetItems),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetCategories.budgetId],
    references: [budgets.id],
  }),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetItems.budgetId],
    references: [budgets.id],
  }),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  user: one(users, {
    fields: [ledgerEntries.userId],
    references: [users.id],
  }),
  account: one(assetAccounts, {
    fields: [ledgerEntries.accountId],
    references: [assetAccounts.id],
  }),
}));

export const investmentHoldingsRelations = relations(investmentHoldings, ({ one, many }) => ({
  user: one(users, {
    fields: [investmentHoldings.userId],
    references: [users.id],
  }),
  transactions: many(investmentTransactions),
}));

export const investmentTransactionsRelations = relations(investmentTransactions, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [investmentTransactions.holdingId],
    references: [investmentHoldings.id],
  }),
  user: one(users, {
    fields: [investmentTransactions.userId],
    references: [users.id],
  }),
}));

// Savings jars (存錢罐)
export const savingsJars = pgTable("savings_jars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  currentAmount: decimal("current_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  includeInDisposable: varchar("include_in_disposable").notNull().default("false"), // "true" or "false"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSavingsJarSchema = createInsertSchema(savingsJars).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSavingsJar = z.infer<typeof insertSavingsJarSchema>;
export type SavingsJar = typeof savingsJars.$inferSelect;

// Savings jar categories (存錢罐的類別分配)
export const savingsJarCategories = pgTable("savings_jar_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jarId: varchar("jar_id").notNull().references(() => savingsJars.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  percentage: integer("percentage").notNull().default(0),
  color: varchar("color").notNull(),
  iconName: varchar("icon_name").default("PiggyBank"), // Icon identifier (optional for backward compatibility)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavingsJarCategorySchema = createInsertSchema(savingsJarCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertSavingsJarCategory = z.infer<typeof insertSavingsJarCategorySchema>;
export type SavingsJarCategory = typeof savingsJarCategories.$inferSelect;

// Savings jar deposits (存錢罐存款記錄)
export const savingsJarDeposits = pgTable("savings_jar_deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jarId: varchar("jar_id").notNull().references(() => savingsJars.id, { onDelete: 'cascade' }),
  accountId: varchar("account_id").references(() => assetAccounts.id, { onDelete: 'set null' }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  depositDate: date("deposit_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavingsJarDepositSchema = createInsertSchema(savingsJarDeposits).omit({
  id: true,
  createdAt: true,
});

export type InsertSavingsJarDeposit = z.infer<typeof insertSavingsJarDepositSchema>;
export type SavingsJarDeposit = typeof savingsJarDeposits.$inferSelect;

export const savingsJarsRelations = relations(savingsJars, ({ one, many }) => ({
  user: one(users, {
    fields: [savingsJars.userId],
    references: [users.id],
  }),
  categories: many(savingsJarCategories),
  deposits: many(savingsJarDeposits),
}));

export const savingsJarCategoriesRelations = relations(savingsJarCategories, ({ one }) => ({
  jar: one(savingsJars, {
    fields: [savingsJarCategories.jarId],
    references: [savingsJars.id],
  }),
}));

export const savingsJarDepositsRelations = relations(savingsJarDeposits, ({ one }) => ({
  jar: one(savingsJars, {
    fields: [savingsJarDeposits.jarId],
    references: [savingsJars.id],
  }),
  account: one(assetAccounts, {
    fields: [savingsJarDeposits.accountId],
    references: [assetAccounts.id],
  }),
}));
