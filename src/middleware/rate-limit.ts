import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';


export const createRateLimitMiddleware = (limiterFactory: () => Ratelimit | null) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Test ortamında direkt geç
        if (process.env.NODE_ENV === 'test') return next();

        try {
            const limiter = limiterFactory();

            if (!limiter) {
                // Konfigürasyon eksikse sistemi kilitleme, uyar ve devam et
                console.warn("Rate limiter skipped: Missing configuration.");
                return next();
            }

            const identifier = req.ip || '127.0.0.1';
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

        } catch (error) {
            console.error("Rate Limit Service Error:", error);
            next();
        }
    };
};