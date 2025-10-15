import {
  users,
  assetAccounts,
  assetHistory,
  budgets,
  budgetCategories,
  ledgerEntries,
  investmentHoldings,
  investmentTransactions,
  savingsJars,
  savingsJarCategories,
  savingsJarDeposits,
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
  type SavingsJar,
  type InsertSavingsJar,
  type SavingsJarCategory,
  type InsertSavingsJarCategory,
  type SavingsJarDeposit,
  type InsertSavingsJarDeposit,
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

  // Savings Jar operations
  getSavingsJars(userId: string): Promise<SavingsJar[]>;
  createSavingsJar(jar: InsertSavingsJar): Promise<SavingsJar>;
  updateSavingsJar(id: string, jar: Partial<InsertSavingsJar>): Promise<SavingsJar>;
  deleteSavingsJar(id: string): Promise<void>;

  // Savings Jar Category operations
  getSavingsJarCategories(jarId: string): Promise<SavingsJarCategory[]>;
  createSavingsJarCategory(category: InsertSavingsJarCategory): Promise<SavingsJarCategory>;
  updateSavingsJarCategory(id: string, category: Partial<InsertSavingsJarCategory>): Promise<SavingsJarCategory>;
  deleteSavingsJarCategory(id: string): Promise<void>;

  // Savings Jar Deposit operations
  getSavingsJarDeposits(jarId: string): Promise<SavingsJarDeposit[]>;
  createSavingsJarDeposit(deposit: InsertSavingsJarDeposit): Promise<SavingsJarDeposit>;
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

  // Savings Jar operations
  async getSavingsJars(userId: string): Promise<SavingsJar[]> {
    return await db.select().from(savingsJars).where(eq(savingsJars.userId, userId));
  }

  async createSavingsJar(jar: InsertSavingsJar): Promise<SavingsJar> {
    const [newJar] = await db.insert(savingsJars).values(jar).returning();
    return newJar;
  }

  async updateSavingsJar(id: string, jar: Partial<InsertSavingsJar>): Promise<SavingsJar> {
    const [updated] = await db
      .update(savingsJars)
      .set({ ...jar, updatedAt: new Date() })
      .where(eq(savingsJars.id, id))
      .returning();
    return updated;
  }

  async deleteSavingsJar(id: string): Promise<void> {
    await db.delete(savingsJars).where(eq(savingsJars.id, id));
  }

  // Savings Jar Category operations
  async getSavingsJarCategories(jarId: string): Promise<SavingsJarCategory[]> {
    return await db.select().from(savingsJarCategories).where(eq(savingsJarCategories.jarId, jarId));
  }

  async createSavingsJarCategory(category: InsertSavingsJarCategory): Promise<SavingsJarCategory> {
    const [newCategory] = await db.insert(savingsJarCategories).values(category).returning();
    return newCategory;
  }

  async updateSavingsJarCategory(id: string, category: Partial<InsertSavingsJarCategory>): Promise<SavingsJarCategory> {
    const [updated] = await db
      .update(savingsJarCategories)
      .set(category)
      .where(eq(savingsJarCategories.id, id))
      .returning();
    return updated;
  }

  async deleteSavingsJarCategory(id: string): Promise<void> {
    await db.delete(savingsJarCategories).where(eq(savingsJarCategories.id, id));
  }

  // Savings Jar Deposit operations
  async getSavingsJarDeposits(jarId: string): Promise<SavingsJarDeposit[]> {
    return await db.select().from(savingsJarDeposits).where(eq(savingsJarDeposits.jarId, jarId));
  }

  async createSavingsJarDeposit(deposit: InsertSavingsJarDeposit): Promise<SavingsJarDeposit> {
    const [newDeposit] = await db.insert(savingsJarDeposits).values(deposit).returning();
    
    // Update jar's current amount
    const [jar] = await db.select().from(savingsJars).where(eq(savingsJars.id, deposit.jarId));
    if (jar) {
      await db
        .update(savingsJars)
        .set({ 
          currentAmount: (parseFloat(jar.currentAmount) + parseFloat(deposit.amount)).toString(),
          updatedAt: new Date()
        })
        .where(eq(savingsJars.id, deposit.jarId));
    }
    
    return newDeposit;
  }
}

export const storage = new DatabaseStorage();
