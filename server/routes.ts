import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { getExchangeRates } from "./exchangeRates";
import {
  insertAssetAccountSchema,
  insertAssetHistorySchema,
  insertBudgetSchema,
  insertBudgetCategorySchema,
  insertBudgetItemSchema,
  insertLedgerEntrySchema,
  insertInvestmentHoldingSchema,
  insertInvestmentTransactionSchema,
  insertSavingsJarSchema,
  insertSavingsJarCategorySchema,
  insertSavingsJarDepositSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Exchange rates endpoint
  app.get('/api/exchange-rates', async (req, res) => {
    try {
      const rates = await getExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Failed to fetch exchange rates" });
    }
  });

  // Transfer endpoint
  app.post('/api/transfer', isAuthenticated, async (req: any, res) => {
    try {
      const { fromAccountId, toAccountId, amount, note } = req.body;
      const userId = req.user.claims.sub;

      if (!fromAccountId || !toAccountId || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get both accounts
      const accounts = await storage.getAssetAccounts(userId);
      const fromAccount = accounts.find(a => a.id === fromAccountId);
      const toAccount = accounts.find(a => a.id === toAccountId);

      if (!fromAccount || !toAccount) {
        return res.status(404).json({ message: "Account not found" });
      }

      const transferAmount = parseFloat(amount);
      const fromBalance = parseFloat(fromAccount.balance);

      if (fromBalance < transferAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Update account balances
      await storage.updateAssetAccount(fromAccountId, {
        ...fromAccount,
        balance: (fromBalance - transferAmount).toString(),
      });

      const toBalance = parseFloat(toAccount.balance);
      await storage.updateAssetAccount(toAccountId, {
        ...toAccount,
        balance: (toBalance + transferAmount).toString(),
      });

      // Create ledger entries for the transfer
      const today = new Date().toISOString().split('T')[0];
      
      // Transfer out entry (expense)
      await storage.createLedgerEntry({
        userId,
        type: "expense",
        amount: amount,
        category: "轉帳",
        accountId: fromAccountId,
        date: today,
        note: note || `轉帳至 ${toAccount.accountName}`,
      });

      // Transfer in entry (income)
      await storage.createLedgerEntry({
        userId,
        type: "income",
        amount: amount,
        category: "轉帳",
        accountId: toAccountId,
        date: today,
        note: note || `從 ${fromAccount.accountName} 轉入`,
      });

      res.json({ message: "Transfer successful" });
    } catch (error) {
      console.error("Error processing transfer:", error);
      res.status(500).json({ message: "Failed to process transfer" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Asset Account routes
  app.get('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getAssetAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.post('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertAssetAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createAssetAccount(data);
      res.json(account);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(400).json({ message: "Failed to create asset" });
    }
  });

  app.patch('/api/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      // Ensure userId is preserved in the update
      const updateData = { ...req.body, userId };
      const account = await storage.updateAssetAccount(id, updateData);
      res.json(account);
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(400).json({ message: "Failed to update asset" });
    }
  });

  app.delete('/api/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAssetAccount(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(400).json({ message: "Failed to delete asset" });
    }
  });

  // Asset History routes
  app.get('/api/asset-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      const history = await storage.getAssetHistory(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(history);
    } catch (error) {
      console.error("Error fetching asset history:", error);
      res.status(500).json({ message: "Failed to fetch asset history" });
    }
  });

  app.post('/api/asset-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertAssetHistorySchema.parse({ ...req.body, userId });
      const history = await storage.createAssetHistory(data);
      res.json(history);
    } catch (error) {
      console.error("Error creating asset history:", error);
      res.status(400).json({ message: "Failed to create asset history" });
    }
  });

  // Budget routes
  app.get('/api/budgets/:month', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { month } = req.params;
      const budget = await storage.getBudget(userId, month);
      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget:", error);
      res.status(500).json({ message: "Failed to fetch budget" });
    }
  });

  app.get('/api/budgets/:month/previous-income', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { month } = req.params;
      
      // Calculate previous month
      const [year, monthNum] = month.split('-').map(Number);
      const prevDate = new Date(year, monthNum - 2, 1); // monthNum - 2 because months are 0-indexed
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Get previous month's ledger entries
      const startDate = `${prevMonth}-01`;
      const lastDay = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate();
      const endDate = `${prevMonth}-${lastDay}`;
      
      const entries = await storage.getLedgerEntries(userId, startDate, endDate);
      
      // Calculate total income
      const totalIncome = entries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      res.json({ totalIncome });
    } catch (error) {
      console.error("Error fetching previous month income:", error);
      res.status(500).json({ message: "Failed to fetch previous month income" });
    }
  });

  app.get('/api/budgets/history/disposable-income', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all budgets for the user
      const budgets = await storage.getAllBudgets(userId);
      
      // Get all ledger entries for the user
      const allEntries = await storage.getAllLedgerEntries(userId);
      
      // Calculate disposable income and remaining for each month
      const history = budgets.map(budget => {
        const [year, month] = budget.month.split('-').map(Number);
        
        // Calculate disposable income
        const disposableIncome = (parseFloat(budget.fixedIncome) - parseFloat(budget.fixedExpense)) + parseFloat(budget.extraIncome);
        
        // Calculate total expense for this month
        const monthExpense = allEntries
          .filter(e => {
            const entryDate = new Date(e.date);
            return e.type === 'expense' && 
                   entryDate.getFullYear() === year && 
                   entryDate.getMonth() + 1 === month;
          })
          .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        const remaining = disposableIncome - monthExpense;
        
        return {
          month: budget.month,
          disposableIncome,
          remaining,
        };
      });
      
      // Sort by month
      history.sort((a, b) => a.month.localeCompare(b.month));
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching disposable income history:", error);
      res.status(500).json({ message: "Failed to fetch disposable income history" });
    }
  });

  app.post('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertBudgetSchema.parse({ ...req.body, userId });
      const budget = await storage.createBudget(data);
      res.json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(400).json({ message: "Failed to create budget" });
    }
  });

  app.patch('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const budget = await storage.updateBudget(id, req.body);
      res.json(budget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(400).json({ message: "Failed to update budget" });
    }
  });

  // Budget Category routes
  app.get('/api/budgets/:budgetId/categories', isAuthenticated, async (req: any, res) => {
    try {
      const { budgetId } = req.params;
      const categories = await storage.getBudgetCategories(budgetId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching budget categories:", error);
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  app.post('/api/budgets/:budgetId/categories', isAuthenticated, async (req: any, res) => {
    try {
      const { budgetId } = req.params;
      const data = insertBudgetCategorySchema.parse({ ...req.body, budgetId });
      const category = await storage.createBudgetCategory(data);
      res.json(category);
    } catch (error) {
      console.error("Error creating budget category:", error);
      res.status(400).json({ message: "Failed to create budget category" });
    }
  });

  app.patch('/api/budgets/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateBudgetCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating budget category:", error);
      res.status(400).json({ message: "Failed to update budget category" });
    }
  });

  app.delete('/api/budgets/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBudgetCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting budget category:", error);
      res.status(400).json({ message: "Failed to delete budget category" });
    }
  });

  // Budget Item routes
  app.get('/api/budgets/:budgetId/items', isAuthenticated, async (req: any, res) => {
    try {
      const { budgetId } = req.params;
      const items = await storage.getBudgetItems(budgetId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  app.post('/api/budgets/:budgetId/items', isAuthenticated, async (req: any, res) => {
    try {
      const { budgetId } = req.params;
      const data = insertBudgetItemSchema.parse({ ...req.body, budgetId });
      const item = await storage.createBudgetItem(data);
      res.json(item);
    } catch (error) {
      console.error("Error creating budget item:", error);
      res.status(400).json({ message: "Failed to create budget item" });
    }
  });

  app.patch('/api/budgets/items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const item = await storage.updateBudgetItem(id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating budget item:", error);
      res.status(400).json({ message: "Failed to update budget item" });
    }
  });

  app.delete('/api/budgets/items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBudgetItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting budget item:", error);
      res.status(400).json({ message: "Failed to delete budget item" });
    }
  });

  // Ledger Entry routes
  app.get('/api/ledger', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      const entries = await storage.getLedgerEntries(userId, startDate as string, endDate as string);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      res.status(500).json({ message: "Failed to fetch ledger entries" });
    }
  });

  app.post('/api/ledger', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertLedgerEntrySchema.parse({ ...req.body, userId });
      const entry = await storage.createLedgerEntry(data);
      res.json(entry);
    } catch (error) {
      console.error("Error creating ledger entry:", error);
      res.status(400).json({ message: "Failed to create ledger entry" });
    }
  });

  app.patch('/api/ledger/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const entry = await storage.updateLedgerEntry(id, req.body);
      res.json(entry);
    } catch (error) {
      console.error("Error updating ledger entry:", error);
      res.status(400).json({ message: "Failed to update ledger entry" });
    }
  });

  app.delete('/api/ledger/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLedgerEntry(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting ledger entry:", error);
      res.status(400).json({ message: "Failed to delete ledger entry" });
    }
  });

  // Investment Holding routes
  app.get('/api/investments/holdings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const holdings = await storage.getInvestmentHoldings(userId);
      res.json(holdings);
    } catch (error) {
      console.error("Error fetching investment holdings:", error);
      res.status(500).json({ message: "Failed to fetch investment holdings" });
    }
  });

  app.post('/api/investments/holdings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertInvestmentHoldingSchema.parse({ ...req.body, userId });
      const holding = await storage.createInvestmentHolding(data);
      res.json(holding);
    } catch (error) {
      console.error("Error creating investment holding:", error);
      res.status(400).json({ message: "Failed to create investment holding" });
    }
  });

  app.patch('/api/investments/holdings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const holding = await storage.updateInvestmentHolding(id, req.body);
      res.json(holding);
    } catch (error) {
      console.error("Error updating investment holding:", error);
      res.status(400).json({ message: "Failed to update investment holding" });
    }
  });

  app.delete('/api/investments/holdings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvestmentHolding(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting investment holding:", error);
      res.status(400).json({ message: "Failed to delete investment holding" });
    }
  });

  // Investment Transaction routes
  app.get('/api/investments/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getInvestmentTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching investment transactions:", error);
      res.status(500).json({ message: "Failed to fetch investment transactions" });
    }
  });

  app.post('/api/investments/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertInvestmentTransactionSchema.parse({ ...req.body, userId });
      const transaction = await storage.createInvestmentTransaction(data);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating investment transaction:", error);
      res.status(400).json({ message: "Failed to create investment transaction" });
    }
  });

  // Savings Jar routes
  app.get('/api/savings-jars', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jars = await storage.getSavingsJars(userId);
      
      // Fetch categories for each jar
      const jarsWithCategories = await Promise.all(
        jars.map(async (jar) => {
          const categories = await storage.getSavingsJarCategories(jar.id);
          return { ...jar, categories };
        })
      );
      
      res.json(jarsWithCategories);
    } catch (error) {
      console.error("Error fetching savings jars:", error);
      res.status(500).json({ message: "Failed to fetch savings jars" });
    }
  });

  app.post('/api/savings-jars', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertSavingsJarSchema.parse({ ...req.body, userId });
      const jar = await storage.createSavingsJar(data);
      res.json(jar);
    } catch (error) {
      console.error("Error creating savings jar:", error);
      res.status(400).json({ message: "Failed to create savings jar" });
    }
  });

  app.patch('/api/savings-jars/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const jar = await storage.updateSavingsJar(id, req.body);
      res.json(jar);
    } catch (error) {
      console.error("Error updating savings jar:", error);
      res.status(400).json({ message: "Failed to update savings jar" });
    }
  });

  app.delete('/api/savings-jars/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSavingsJar(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting savings jar:", error);
      res.status(400).json({ message: "Failed to delete savings jar" });
    }
  });

  // Savings Jar Category routes
  app.get('/api/savings-jars/:jarId/categories', isAuthenticated, async (req: any, res) => {
    try {
      const { jarId } = req.params;
      const categories = await storage.getSavingsJarCategories(jarId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching jar categories:", error);
      res.status(500).json({ message: "Failed to fetch jar categories" });
    }
  });

  app.post('/api/savings-jars/:jarId/categories', isAuthenticated, async (req: any, res) => {
    try {
      const { jarId } = req.params;
      const data = insertSavingsJarCategorySchema.parse({ ...req.body, jarId });
      const category = await storage.createSavingsJarCategory(data);
      res.json(category);
    } catch (error) {
      console.error("Error creating jar category:", error);
      res.status(400).json({ message: "Failed to create jar category" });
    }
  });

  app.patch('/api/savings-jars/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateSavingsJarCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating jar category:", error);
      res.status(400).json({ message: "Failed to update jar category" });
    }
  });

  app.delete('/api/savings-jars/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSavingsJarCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting jar category:", error);
      res.status(400).json({ message: "Failed to delete jar category" });
    }
  });

  // Savings Jar Deposit routes
  app.get('/api/savings-jars/:jarId/deposits', isAuthenticated, async (req: any, res) => {
    try {
      const { jarId } = req.params;
      const deposits = await storage.getSavingsJarDeposits(jarId);
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching jar deposits:", error);
      res.status(500).json({ message: "Failed to fetch jar deposits" });
    }
  });

  app.post('/api/savings-jars/:jarId/deposits', isAuthenticated, async (req: any, res) => {
    try {
      const { jarId } = req.params;
      const data = insertSavingsJarDepositSchema.parse({ ...req.body, jarId });
      const deposit = await storage.createSavingsJarDeposit(data);
      res.json(deposit);
    } catch (error) {
      console.error("Error creating jar deposit:", error);
      res.status(400).json({ message: "Failed to create jar deposit" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
