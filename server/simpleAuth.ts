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
  console.log('[Auth] 🔐 Checking authentication for:', req.method, req.path);
  console.log('[Auth] Session exists:', !!req.session);
  console.log('[Auth] Session userId:', req.session?.userId);
  
  // Try to get session from cookie first (if browser supports it)
  if (req.session && req.session.userId) {
    req.user = { claims: { sub: req.session.userId } };
    console.log('[Auth] ✅ Authenticated via session cookie, userId:', req.session.userId);
    return next();
  }
  
  // Fallback: Get session ID from Authorization header
  const authHeader = req.headers.authorization;
  console.log('[Auth] Authorization header:', authHeader ? 'present' : 'missing');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const sessionToken = authHeader.substring(7); // Remove 'Bearer '
    
    // Load session from store using the token (session ID)
    req.sessionStore.get(sessionToken, (err: any, sessionData: any) => {
      if (err) {
        console.error('[Auth] ❌ Error loading session from token:', err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (sessionData && sessionData.userId) {
        // Attach user info to request
        req.user = { claims: { sub: sessionData.userId } };
        req.session = req.session || {};
        req.session.userId = sessionData.userId;
        console.log('[Auth] ✅ Authenticated via Authorization header, userId:', sessionData.userId);
        return next();
      } else {
        console.log('[Auth] ❌ Invalid or expired session token');
        return res.status(401).json({ message: "Unauthorized" });
      }
    });
  } else {
    console.log('[Auth] ❌ No valid authentication found');
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
        
        // SOLUTION: Return session ID as token for Authorization header
        // This bypasses browser cookie restrictions
        const sessionToken = req.session.id;
        
        // Still try to set cookie for browsers that support it
        const cookieValue = `${SESSION_CONFIG.COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; ${ENV.IS_PRODUCTION ? 'Secure; SameSite=None' : 'SameSite=Lax'}; Max-Age=${SESSION_CONFIG.TTL / 1000}`;
        res.setHeader('Set-Cookie', cookieValue);
        
        console.log('[Auth] 🎫 Session token (for Authorization header):', sessionToken);
        console.log('[Auth] Also attempting cookie (may be blocked by browser):', cookieValue);
        
        // Send response with session token
        res.json({ 
          success: true,
          sessionToken: sessionToken, // ← Client will store this and send in Authorization header
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
    console.log('[Auth] === Check User Request ===');
    console.log('[Auth] Cookie:', req.headers.cookie);
    console.log('[Auth] Authorization:', req.headers.authorization);
    
    // Try cookie-based session first
    if (req.session && req.session.userId) {
      console.log('[Auth] ✅ Authenticated via Cookie');
      return res.json({ 
        authenticated: true,
        userId: req.session.userId,
      });
    }
    
    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      
      req.sessionStore.get(sessionToken, (err: any, sessionData: any) => {
        if (err) {
          console.error('[Auth] ❌ Error loading session:', err);
          return res.status(401).json({ authenticated: false });
        }
        
        if (sessionData && sessionData.userId) {
          console.log('[Auth] ✅ Authenticated via Authorization header');
          return res.json({ 
            authenticated: true,
            userId: sessionData.userId,
          });
        } else {
          console.log('[Auth] ❌ Invalid session token');
          return res.status(401).json({ authenticated: false });
        }
      });
    } else {
      console.log('[Auth] ❌ No authentication found');
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
