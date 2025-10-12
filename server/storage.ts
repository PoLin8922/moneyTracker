import {
  users,
  assetAccounts,
  assetHistory,
  budgets,
  budgetCategories,
  ledgerEntries,
  investmentHoldings,
  investmentTransactions,
  type User,
  type UpsertUser,
  type AssetAccount,
  type InsertAssetAccount,
  type AssetHistory,
  type InsertAssetHistory,
  type Budget,
  type InsertBudget,
  type BudgetCategory,
  type InsertBudgetCategory,
  type LedgerEntry,
  type InsertLedgerEntry,
  type InvestmentHolding,
  type InsertInvestmentHolding,
  type InvestmentTransaction,
  type InsertInvestmentTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Asset Account operations
  getAssetAccounts(userId: string): Promise<AssetAccount[]>;
  createAssetAccount(account: InsertAssetAccount): Promise<AssetAccount>;
  updateAssetAccount(id: string, account: Partial<InsertAssetAccount>): Promise<AssetAccount>;
  deleteAssetAccount(id: string): Promise<void>;

  // Asset History operations
  getAssetHistory(userId: string, startDate?: Date, endDate?: Date): Promise<AssetHistory[]>;
  createAssetHistory(history: InsertAssetHistory): Promise<AssetHistory>;

  // Budget operations
  getBudget(userId: string, month: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget>;

  // Budget Category operations
  getBudgetCategories(budgetId: string): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: string, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory>;
  deleteBudgetCategory(id: string): Promise<void>;

  // Ledger Entry operations
  getLedgerEntries(userId: string, startDate?: string, endDate?: string): Promise<LedgerEntry[]>;
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;
  updateLedgerEntry(id: string, entry: Partial<InsertLedgerEntry>): Promise<LedgerEntry>;
  deleteLedgerEntry(id: string): Promise<void>;

  // Investment Holding operations
  getInvestmentHoldings(userId: string): Promise<InvestmentHolding[]>;
  createInvestmentHolding(holding: InsertInvestmentHolding): Promise<InvestmentHolding>;
  updateInvestmentHolding(id: string, holding: Partial<InsertInvestmentHolding>): Promise<InvestmentHolding>;
  deleteInvestmentHolding(id: string): Promise<void>;

  // Investment Transaction operations
  getInvestmentTransactions(userId: string): Promise<InvestmentTransaction[]>;
  createInvestmentTransaction(transaction: InsertInvestmentTransaction): Promise<InvestmentTransaction>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Asset Account operations
  async getAssetAccounts(userId: string): Promise<AssetAccount[]> {
    return await db.select().from(assetAccounts).where(eq(assetAccounts.userId, userId));
  }

  async createAssetAccount(account: InsertAssetAccount): Promise<AssetAccount> {
    const [newAccount] = await db.insert(assetAccounts).values(account).returning();
    return newAccount;
  }

  async updateAssetAccount(id: string, account: Partial<InsertAssetAccount>): Promise<AssetAccount> {
    const [updated] = await db
      .update(assetAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(assetAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteAssetAccount(id: string): Promise<void> {
    await db.delete(assetAccounts).where(eq(assetAccounts.id, id));
  }

  // Asset History operations
  async getAssetHistory(userId: string, startDate?: Date, endDate?: Date): Promise<AssetHistory[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(assetHistory)
        .where(
          and(
            eq(assetHistory.userId, userId),
            gte(assetHistory.recordedAt, startDate),
            lte(assetHistory.recordedAt, endDate)
          )
        )
        .orderBy(desc(assetHistory.recordedAt));
    }
    
    return await db
      .select()
      .from(assetHistory)
      .where(eq(assetHistory.userId, userId))
      .orderBy(desc(assetHistory.recordedAt))
      .limit(100);
  }

  async createAssetHistory(history: InsertAssetHistory): Promise<AssetHistory> {
    const [newHistory] = await db.insert(assetHistory).values(history).returning();
    return newHistory;
  }

  // Budget operations
  async getBudget(userId: string, month: string): Promise<Budget | undefined> {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.month, month)));
    return budget;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget> {
    const [updated] = await db
      .update(budgets)
      .set({ ...budget, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return updated;
  }

  // Budget Category operations
  async getBudgetCategories(budgetId: string): Promise<BudgetCategory[]> {
    return await db.select().from(budgetCategories).where(eq(budgetCategories.budgetId, budgetId));
  }

  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> {
    const [newCategory] = await db.insert(budgetCategories).values(category).returning();
    return newCategory;
  }

  async updateBudgetCategory(id: string, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory> {
    const [updated] = await db
      .update(budgetCategories)
      .set(category)
      .where(eq(budgetCategories.id, id))
      .returning();
    return updated;
  }

  async deleteBudgetCategory(id: string): Promise<void> {
    await db.delete(budgetCategories).where(eq(budgetCategories.id, id));
  }

  // Ledger Entry operations
  async getLedgerEntries(userId: string, startDate?: string, endDate?: string): Promise<LedgerEntry[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.userId, userId),
            gte(ledgerEntries.date, startDate),
            lte(ledgerEntries.date, endDate)
          )
        )
        .orderBy(desc(ledgerEntries.date));
    }
    
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.userId, userId))
      .orderBy(desc(ledgerEntries.date))
      .limit(100);
  }

  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    const [newEntry] = await db.insert(ledgerEntries).values(entry).returning();
    return newEntry;
  }

  async updateLedgerEntry(id: string, entry: Partial<InsertLedgerEntry>): Promise<LedgerEntry> {
    const [updated] = await db
      .update(ledgerEntries)
      .set(entry)
      .where(eq(ledgerEntries.id, id))
      .returning();
    return updated;
  }

  async deleteLedgerEntry(id: string): Promise<void> {
    await db.delete(ledgerEntries).where(eq(ledgerEntries.id, id));
  }

  // Investment Holding operations
  async getInvestmentHoldings(userId: string): Promise<InvestmentHolding[]> {
    return await db.select().from(investmentHoldings).where(eq(investmentHoldings.userId, userId));
  }

  async createInvestmentHolding(holding: InsertInvestmentHolding): Promise<InvestmentHolding> {
    const [newHolding] = await db.insert(investmentHoldings).values(holding).returning();
    return newHolding;
  }

  async updateInvestmentHolding(id: string, holding: Partial<InsertInvestmentHolding>): Promise<InvestmentHolding> {
    const [updated] = await db
      .update(investmentHoldings)
      .set({ ...holding, updatedAt: new Date() })
      .where(eq(investmentHoldings.id, id))
      .returning();
    return updated;
  }

  async deleteInvestmentHolding(id: string): Promise<void> {
    await db.delete(investmentHoldings).where(eq(investmentHoldings.id, id));
  }

  // Investment Transaction operations
  async getInvestmentTransactions(userId: string): Promise<InvestmentTransaction[]> {
    return await db
      .select()
      .from(investmentTransactions)
      .where(eq(investmentTransactions.userId, userId))
      .orderBy(desc(investmentTransactions.transactionDate));
  }

  async createInvestmentTransaction(transaction: InsertInvestmentTransaction): Promise<InvestmentTransaction> {
    const [newTransaction] = await db.insert(investmentTransactions).values(transaction).returning();
    return newTransaction;
  }
}

export const storage = new DatabaseStorage();
