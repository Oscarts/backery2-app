import rateLimit from 'express-rate-limit';

// Helper to extract IP from request (handles IPv6)
const getIpFromRequest = (req: any): string => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * Rate Limiting Configuration for RapidPro API
 * 
 * Protects against:
 * - Brute force attacks on authentication endpoints
 * - DDoS attacks
 * - API abuse
 * 
 * Development mode: Rate limiting is relaxed for easier testing
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// General API rate limiter - 100 requests per 15 minutes (1000 in dev)
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 100, // More lenient in development
    message: {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    },
});

// Strict rate limiter for authentication endpoints - 5 requests per 15 minutes (50 in dev)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 50 : 5, // More lenient in development for testing
    message: {
        error: 'Too many authentication attempts',
        message: 'Too many login attempts. Please try again after 15 minutes.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Don't count successful login requests towards the limit so normal
    // login/logout activity won't cause accidental lockouts.
    // Only failed authentication attempts should be counted.
    skipSuccessfulRequests: true,
    // Use a key that scopes attempts to tenant+username when available so
    // users sharing an IP (office/home) don't cause global lockouts for one another.
    keyGenerator: (req: any) => {
        const body: any = (req && req.body) || {};
        const username = String(body.email || body.username || body.login || '');
        const clientId = String(body.clientId || (req && req.headers && (req.headers as any)['x-client-id']) || '');
        if (clientId || username) return `${clientId}:${username}`;
        // Use helper function for proper IP handling
        return getIpFromRequest(req);
    },
});

// Signup rate limiter - 3 signups per hour per IP (30 in dev)
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 30 : 3, // More lenient in development
    message: {
        error: 'Too many signup attempts',
        message: 'Too many accounts created from this IP. Please try again later.',
        retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Password reset rate limiter - 3 requests per hour (30 in dev)
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 30 : 3, // More lenient in development
    message: {
        error: 'Too many password reset attempts',
        message: 'Too many password reset requests. Please try again later.',
        retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// API creation limiter for expensive operations - 30 per 15 minutes (300 in dev)
export const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 300 : 30, // More lenient in development
    message: {
        error: 'Too many create requests',
        message: 'You are creating resources too quickly. Please slow down.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
