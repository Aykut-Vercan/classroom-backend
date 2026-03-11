import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
export const createRateLimitMiddleware = (limiter: Ratelimit) => {

    return async (req: Request, res: Response, next: NextFunction) => {
        if (process.env.NODE_ENV === 'test') {
            return next();
        }
        const identifier = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';

        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', reset.toString());

        if (!success) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Çok fazla istek attınız, lütfen bekleyin.',
                retryAfter: Math.ceil((reset - Date.now()) / 1000)
            });
        }
        next();
    };
};

