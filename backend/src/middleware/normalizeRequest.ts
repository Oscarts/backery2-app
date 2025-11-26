import { Request, Response, NextFunction } from 'express';

// Normalize certain request fields to avoid subtle mismatches
export default function normalizeRequest(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.body && typeof req.body.email === 'string') {
            // Trim and lowercase emails to ensure consistent lookup
            req.body.email = req.body.email.trim().toLowerCase();
        }
    } catch (err) {
        // Don't block requests on normalization errors
        console.error('normalizeRequest error:', err);
    }

    return next();
}
