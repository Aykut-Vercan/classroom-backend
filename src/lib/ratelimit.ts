import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. Redis bağlantısını tek bir noktadan ve sadece ihtiyaç anında oluşturuyoruz
const getRedisClient = () => {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        // Test ortamındaysak veya env'ler eksikse uygulama ÇÖKMESİN, null dönsün
        if (process.env.NODE_ENV === 'test') return null;
        throw new Error('Upstash Redis env (URL or TOKEN) variable is required!');
    }

    return new Redis({ url, token });
};

// 2. Her bir limiter için bir "Getter" fonksiyonu oluşturuyoruz
// Bu sayede import anında değil, sadece middleware çalıştığında kontrol yapılacak

export const getGlobalRateLimit = () => {
    const redis = getRedisClient();
    if (!redis) return null;

    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "10 s"),
        analytics: true,
        prefix: "ratelimit_global",
    });
};

export const getAuthRateLimit = () => {
    const redis = getRedisClient();
    if (!redis) return null;

    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
        prefix: "ratelimit_auth"
    });
};

export const getEnrollRateLimit = () => {
    const redis = getRedisClient();
    if (!redis) return null;

    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 m"),
        analytics: true,
        prefix: "ratelimit_enroll"
    });
};