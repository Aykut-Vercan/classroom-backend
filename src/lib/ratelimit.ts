import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Ratelimit'in constructor'ının aldığı parametrenin tipini otomatik çıkarır.
// Elle yazmak yerine TypeScript'e soruyoruz — kütüphane güncellense bile tip bozulmaz.
type RatelimitConfig = ConstructorParameters<typeof Ratelimit>[0];

let redisClient: Redis | null = null;

// 1. Redis bağlantısını tek bir noktadan ve sadece ihtiyaç anında oluşturuyoruz
const getRedisClient = (): Redis | null => {

    if (redisClient) return redisClient;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        // Test ortamındaysak veya env'ler eksikse uygulama ÇÖKMESİN, null dönsün
        if (process.env.NODE_ENV === 'test') return null;
        throw new Error('Upstash Redis env (URL or TOKEN) variable is required!');
    }

    redisClient = new Redis({ url, token });
    return redisClient;
};

//Omit<RatelimitConfig, 'redis'> redis alanını config'den çıkarıyoruz çünkü onu zaten getRedisClient() ile kendimiz sağlıyoruz. 
const createRateLimiter = (config: Omit<RatelimitConfig, 'redis'>) => {
    let instance: Ratelimit | null = null;// her limiter'a özel cache

    return (): Ratelimit | null => {
        if (instance) return instance;// singleton kontrolü

        const redis = getRedisClient();
        if (!redis) return null;

        instance = new Ratelimit({ redis, ...config });
        return instance;
    };
    //config dışarıdan bir kez alınıyor.
    //instance ise closure sayesinde her createRateLimiter çağrısında ayrı yaşıyor.
    //Yani getGlobalRateLimit ve getAuthRateLimit'in instance'ları birbirinden tamamen izole.
};

export const getGlobalRateLimit = createRateLimiter({
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "ratelimit_global",
});


export const getAuthRateLimit = createRateLimiter({
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
    prefix: "ratelimit_auth",
});

export const getEnrollRateLimit = createRateLimiter({
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
    prefix: "ratelimit_enroll",
});