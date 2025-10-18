/**
 * Centralized Configuration
 * ⚠️ IMPORTANT: All configuration constants should be defined here
 * to ensure consistency across the application
 */

// ============================================
// SESSION CONFIGURATION
// ============================================
export const SESSION_CONFIG = {
  /**
   * PostgreSQL table name for storing sessions
   * ⚠️ CRITICAL: This must match across all files:
   * - simpleAuth.ts
   * - replitAuth.ts
   * - setup-session-table.sql
   */
  TABLE_NAME: 'user_sessions',
  
  /**
   * Cookie name sent to client browser
   * Must be unique and not conflict with other apps
   */
  COOKIE_NAME: 'sessionId',
  
  /**
   * Session TTL (Time To Live)
   * Default: 30 days in milliseconds
   */
  TTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  /**
   * Session secret key
   * ⚠️ MUST be set in production via SESSION_SECRET env var
   */
  SECRET: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
} as const;

// ============================================
// ENVIRONMENT FLAGS
// ============================================
export const ENV = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_REPLIT: !!process.env.REPLIT_DOMAINS,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DATABASE_URL: process.env.DATABASE_URL,
} as const;

// ============================================
// CORS CONFIGURATION
// ============================================
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'http://localhost:5000',
    'http://localhost:5173',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[],
} as const;
