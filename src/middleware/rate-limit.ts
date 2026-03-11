import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { ApiError } from '../utils/ApiError';


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
                throw new ApiError(429, 'Çok fazla istek attınız, lütfen bekleyin.');
            }
            next();

        } catch (error) {
            if (error instanceof ApiError) {
                return next(error); // 429'u error handler'a ilet
            }
            console.error("Rate Limit Service Error:", error);
            next();
        }
    };
};