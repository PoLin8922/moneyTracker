// Simple session-based authentication (for non-Replit deployment)
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import crypto from "crypto";
import { SESSION_CONFIG, ENV } from "./config";

// Extend Express Request type
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Setup session middleware
export function setupSimpleAuth(app: Express) {
  // Use PostgreSQL session store for persistence
  const PgSession = connectPgSimple(session);
  
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: SESSION_CONFIG.TABLE_NAME, // ⚠️ Using centralized config
        createTableIfMissing: false, // Don't auto-create, we'll manage manually
      }),
      secret: SESSION_CONFIG.SECRET,
      resave: false,
      saveUninitialized: false,
      name: SESSION_CONFIG.COOKIE_NAME, // ⚠️ Using centralized config
      cookie: {
        secure: ENV.IS_PRODUCTION, // Only secure in production (requires HTTPS)
        httpOnly: true,
        sameSite: ENV.IS_PRODUCTION ? 'none' : 'lax', // 'none' required for cross-origin in production
        maxAge: SESSION_CONFIG.TTL,
        path: '/', // Ensure cookie is sent for all paths
      },
    })
  );
  
  console.log('[Auth] Session middleware configured:', {
    store: 'PostgreSQL',
    tableName: SESSION_CONFIG.TABLE_NAME,
    secure: ENV.IS_PRODUCTION,
    sameSite: ENV.IS_PRODUCTION ? 'none' : 'lax',
    cookieName: SESSION_CONFIG.COOKIE_NAME,
  });
}

// Auth middleware - check if user is logged in
export function requireAuth(req: any, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    // Attach user info to request
    req.user = { claims: { sub: req.session.userId } };
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Register/Login route
export function registerAuthRoutes(app: Express) {
  // Register or auto-login route (simple, no password)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      
      if (!email || email.trim().length === 0) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate a unique user ID based on email
      const userId = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 16);
      
      // Create or update user (upsertUser handles both)
      console.log('[Auth] Login/Register user:', email);
      const user = await storage.upsertUser({
        id: userId,
        email: email.trim().toLowerCase(),
        firstName: name || email.split('@')[0], // Use name or email prefix
      });

      // Set session
      req.session.userId = userId;
      
      // Explicitly save the session before sending response
      req.session.save((err) => {
        if (err) {
          console.error('[Auth] ❌ Session save error:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log('[Auth] ✅ User logged in:', email, '(ID:', userId, ')');
        console.log('[Auth] Session ID:', req.session.id);
        console.log('[Auth] Session saved, userId:', req.session.userId);
        console.log('[Auth] Session cookie:', req.session.cookie);
        
        // Manually construct and set the cookie to ensure it's sent
        const cookieValue = `${SESSION_CONFIG.COOKIE_NAME}=${req.session.id}; Path=/; HttpOnly; ${ENV.IS_PRODUCTION ? 'Secure; SameSite=None' : 'SameSite=Lax'}; Max-Age=${SESSION_CONFIG.TTL / 1000}`;
        res.setHeader('Set-Cookie', cookieValue);
        
        console.log('[Auth] Manual Set-Cookie:', cookieValue);
        
        // Send response
        res.json({ 
          success: true, 
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
          }
        });
      });
    } catch (error: any) {
      console.error('[Auth] ❌ Login error:', error);
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  });

  // Get current user
  app.get('/api/auth/user', (req: any, res: Response) => {
    console.log('[Auth] Check user - Session ID:', req.session?.id);
    console.log('[Auth] Check user - Session userId:', req.session?.userId);
    console.log('[Auth] Check user - Cookie:', req.headers.cookie);
    
    if (req.session && req.session.userId) {
      res.json({ 
        authenticated: true,
        userId: req.session.userId,
      });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('[Auth] Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
}
