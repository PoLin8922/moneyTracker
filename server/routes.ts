import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { investmentHoldings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSimpleAuth, requireAuth, registerAuthRoutes } from "./simpleAuth";
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
  // Setup authentication based on environment
  if (process.env.REPLIT_DOMAINS) {
    // Use Replit OAuth on Replit
    await setupAuth(app);
    var authMiddleware = isAuthenticated;
  } else {
    // Use simple session auth elsewhere (session middleware already setup in index.ts)
    registerAuthRoutes(app);
    var authMiddleware = requireAuth;
  }

  // Health check endpoint (no auth required)
  app.get('/api/health', async (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Backend is running!',
      environment: process.env.NODE_ENV || 'development'
    });
  });

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
  app.post('/api/transfer', authMiddleware, async (req: any, res) => {
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
  app.get('/api/auth/user', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // In test mode (no Replit), return a mock user
      if (!process.env.REPLIT_DOMAINS) {
        return res.json({
          id: userId,
          email: 'demo@moneytrack.app',
          firstName: '測試',
          lastName: '用戶',
          profileImageUrl: null,
        });
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Asset Account routes
  app.get('/api/assets', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('[API] Fetching assets for user:', userId);
      const accounts = await storage.getAssetAccounts(userId);
      console.log('[API] Found', accounts.length, 'accounts');
      res.json(accounts);
    } catch (error: any) {
      console.error("❌ Error fetching assets:", error.message);
      console.error("Stack:", error.stack);
      res.status(500).json({ 
        message: "Failed to fetch assets",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.post('/api/assets', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('[API] Creating asset for user:', userId);
      console.log('[API] Request body:', JSON.stringify(req.body, null, 2));
      const data = insertAssetAccountSchema.parse({ ...req.body, userId });
      console.log('[API] Parsed data:', JSON.stringify(data, null, 2));
      const account = await storage.createAssetAccount(data);
      console.log('[API] ✅ Asset created successfully:', account.id);
      res.json(account);
    } catch (error: any) {
      console.error("❌ Error creating asset:", error.message);
      if (error.errors) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
      }
      console.error("Stack:", error.stack);
      res.status(400).json({ 
        message: "Failed to create asset",
        error: error.message,
        details: error.errors || undefined
      });
    }
  });

  app.patch('/api/assets/:id', authMiddleware, async (req: any, res) => {
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

  app.delete('/api/assets/:id', authMiddleware, async (req: any, res) => {
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
  app.get('/api/asset-history', authMiddleware, async (req: any, res) => {
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

  app.post('/api/asset-history', authMiddleware, async (req: any, res) => {
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
  app.get('/api/budgets/:month', authMiddleware, async (req: any, res) => {
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

  app.get('/api/budgets/:month/previous-income', authMiddleware, async (req: any, res) => {
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

  app.get('/api/budgets/history/disposable-income', authMiddleware, async (req: any, res) => {
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

  app.post('/api/budgets', authMiddleware, async (req: any, res) => {
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

  app.patch('/api/budgets/:id', authMiddleware, async (req: any, res) => {
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
  app.get('/api/budgets/:budgetId/categories', authMiddleware, async (req: any, res) => {
    try {
      const { budgetId } = req.params;
      const categories = await storage.getBudgetCategories(budgetId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching budget categories:", error);
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  app.post('/api/budgets/:budgetId/categories', authMiddleware, async (req: any, res) => {
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

  app.patch('/api/budgets/categories/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateBudgetCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating budget category:", error);
      res.status(400).json({ message: "Failed to update budget category" });
    }
  });

  app.delete('/api/budgets/categories/:id', authMiddleware, async (req: any, res) => {
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
  app.get('/api/budgets/:budgetId/items', authMiddleware, async (req: any, res) => {
    try {
      const { budgetId } = req.params;
      const items = await storage.getBudgetItems(budgetId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  app.post('/api/budgets/:budgetId/items', authMiddleware, async (req: any, res) => {
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

  app.patch('/api/budgets/items/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const item = await storage.updateBudgetItem(id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating budget item:", error);
      res.status(400).json({ message: "Failed to update budget item" });
    }
  });

  app.delete('/api/budgets/items/:id', authMiddleware, async (req: any, res) => {
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
  app.get('/api/ledger', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, accountId } = req.query;
      const entries = await storage.getLedgerEntries(userId, startDate as string, endDate as string, accountId as string);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      res.status(500).json({ message: "Failed to fetch ledger entries" });
    }
  });

  app.post('/api/ledger', authMiddleware, async (req: any, res) => {
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

  app.patch('/api/ledger/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const entry = await storage.updateLedgerEntry(id, req.body);
      res.json(entry);
    } catch (error) {
      console.error("Error updating ledger entry:", error);
      res.status(400).json({ message: "Failed to update ledger entry" });
    }
  });

  app.delete('/api/ledger/:id', authMiddleware, async (req: any, res) => {
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
  app.get('/api/investments/holdings', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const holdings = await storage.getInvestmentHoldings(userId);
      res.json(holdings);
    } catch (error) {
      console.error("Error fetching investment holdings:", error);
      res.status(500).json({ message: "Failed to fetch investment holdings" });
    }
  });

  app.post('/api/investments/holdings', authMiddleware, async (req: any, res) => {
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

  app.patch('/api/investments/holdings/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const holding = await storage.updateInvestmentHolding(id, req.body);
      res.json(holding);
    } catch (error) {
      console.error("Error updating investment holding:", error);
      res.status(400).json({ message: "Failed to update investment holding" });
    }
  });

  app.delete('/api/investments/holdings/:id', authMiddleware, async (req: any, res) => {
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
  app.get('/api/investments/transactions', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getInvestmentTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching investment transactions:", error);
      res.status(500).json({ message: "Failed to fetch investment transactions" });
    }
  });

  app.post('/api/investments/transactions', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        type, 
        ticker, 
        name,
        quantity, 
        pricePerShare, 
        fees, 
        paymentAccountId, 
        brokerAccountId, 
        transactionDate 
      } = req.body;

      // 驗證必填欄位
      if (!type || !ticker || !name || !quantity || !pricePerShare || !paymentAccountId || !brokerAccountId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const qty = parseFloat(quantity);
      const price = parseFloat(pricePerShare);
      const fee = parseFloat(fees) || 0;
      const totalAmount = type === 'buy' ? (qty * price + fee) : (qty * price - fee);

      // 1. 更新付款帳戶餘額
      const paymentAccount = await storage.getAssetAccount(paymentAccountId);
      if (!paymentAccount) {
        return res.status(404).json({ message: "Payment account not found" });
      }

      const currentBalance = parseFloat(paymentAccount.balance);
      const newPaymentBalance = type === 'buy' 
        ? currentBalance - totalAmount  // 買入扣款
        : currentBalance + totalAmount; // 賣出入帳

      if (type === 'buy' && newPaymentBalance < 0) {
        return res.status(400).json({ message: "Insufficient balance in payment account" });
      }

      await storage.updateAssetAccount(paymentAccountId, {
        ...paymentAccount,
        balance: newPaymentBalance.toString(),
      });

      // 2. 查找或創建持倉記錄
      const allHoldings = await storage.getInvestmentHoldings(userId);
      let holding: any = allHoldings.find(h => 
        h.ticker === ticker && h.brokerAccountId === brokerAccountId
      );

      if (type === 'buy') {
        if (holding) {
          // 更新現有持倉
          const oldQty = parseFloat(holding.quantity);
          const oldCost = parseFloat(holding.averageCost);
          const newQty = oldQty + qty;
          const newAvgCost = ((oldQty * oldCost) + (qty * price)) / newQty;

          await storage.updateInvestmentHolding(holding.id, {
            quantity: newQty.toString(),
            averageCost: newAvgCost.toFixed(2),
            currentPrice: price.toString(),
          });
          
          holding = await db.select().from(investmentHoldings)
            .where(eq(investmentHoldings.id, holding.id))
            .then(rows => rows[0]);
        } else {
          // 創建新持倉
          holding = await storage.createInvestmentHolding({
            userId,
            brokerAccountId,
            ticker,
            name,
            type: (await storage.getAssetAccount(brokerAccountId))!.type, // 使用券商帳戶類型
            quantity: qty.toString(),
            averageCost: price.toString(),
            currentPrice: price.toString(),
          });
        }
      } else {
        // 賣出
        if (!holding) {
          return res.status(400).json({ message: "No holding found to sell" });
        }

        const oldQty = parseFloat(holding.quantity);
        if (oldQty < qty) {
          return res.status(400).json({ message: "Insufficient quantity to sell" });
        }

        const newQty = oldQty - qty;
        if (newQty === 0) {
          // 全部賣出，刪除持倉
          await storage.deleteInvestmentHolding(holding.id);
          holding = null;
        } else {
          // 部分賣出，更新數量
          await storage.updateInvestmentHolding(holding.id, {
            quantity: newQty.toString(),
            currentPrice: price.toString(),
          });
          
          holding = await db.select().from(investmentHoldings)
            .where(eq(investmentHoldings.id, holding.id))
            .then(rows => rows[0]);
        }
      }

      // 3. 更新券商帳戶總市值（balance欄位）
      const brokerHoldings = await storage.getInvestmentHoldings(userId);
      const totalMarketValue = brokerHoldings
        .filter(h => h.brokerAccountId === brokerAccountId)
        .reduce((sum, h) => {
          return sum + (parseFloat(h.quantity) * parseFloat(h.currentPrice));
        }, 0);

      const brokerAccount = await storage.getAssetAccount(brokerAccountId);
      await storage.updateAssetAccount(brokerAccountId, {
        ...brokerAccount!,
        balance: totalMarketValue.toString(),
      });

      // 4. 記錄交易歷史
      const transaction = await storage.createInvestmentTransaction({
        userId,
        holdingId: holding?.id || "deleted",  // 如果全部賣出，記錄 "deleted"
        paymentAccountId,
        brokerAccountId,
        type,
        quantity: qty.toString(),
        pricePerShare: price.toString(),
        fees: fee.toString(),
        transactionDate,
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating investment transaction:", error);
      res.status(400).json({ message: "Failed to create investment transaction" });
    }
  });

  // Savings Jar routes
  app.get('/api/savings-jars', authMiddleware, async (req: any, res) => {
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

  app.post('/api/savings-jars', authMiddleware, async (req: any, res) => {
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

  app.patch('/api/savings-jars/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const jar = await storage.updateSavingsJar(id, req.body);
      res.json(jar);
    } catch (error) {
      console.error("Error updating savings jar:", error);
      res.status(400).json({ message: "Failed to update savings jar" });
    }
  });

  app.delete('/api/savings-jars/:id', authMiddleware, async (req: any, res) => {
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
  app.get('/api/savings-jars/:jarId/categories', authMiddleware, async (req: any, res) => {
    try {
      const { jarId } = req.params;
      const categories = await storage.getSavingsJarCategories(jarId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching jar categories:", error);
      res.status(500).json({ message: "Failed to fetch jar categories" });
    }
  });

  app.post('/api/savings-jars/:jarId/categories', authMiddleware, async (req: any, res) => {
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

  app.patch('/api/savings-jars/categories/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateSavingsJarCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating jar category:", error);
      res.status(400).json({ message: "Failed to update jar category" });
    }
  });

  app.delete('/api/savings-jars/categories/:id', authMiddleware, async (req: any, res) => {
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
  app.get('/api/savings-jars/:jarId/deposits', authMiddleware, async (req: any, res) => {
    try {
      const { jarId } = req.params;
      const deposits = await storage.getSavingsJarDeposits(jarId);
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching jar deposits:", error);
      res.status(500).json({ message: "Failed to fetch jar deposits" });
    }
  });

  app.post('/api/savings-jars/:jarId/deposits', authMiddleware, async (req: any, res) => {
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
