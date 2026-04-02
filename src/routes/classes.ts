import express from 'express';
import { db } from '../db/index.js';
import { classes } from '../db/schema/index.js';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { createRateLimitMiddleware } from '../middleware/rate-limit.js';
import { getGlobalRateLimit } from '../lib/ratelimit.js';

const router = express.Router();
const globalLimit = createRateLimitMiddleware(getGlobalRateLimit);

const createClassSchema = z.object({
    name: z.string().min(2).max(150),
    subjectId: z.number().int().positive(),
    teacherId: z.string().min(1),
    bannerUrl: z.string().min(1),
    bannerCldPubId: z.string().min(1),
    description: z.string().min(5).max(500).optional(),
    capacity: z.number().int().min(1).max(500).optional(),
    status: z.enum(['active', 'inactive']).optional(),
});

router.post('/', globalLimit, async (req, res, next) => {
    try {
        const parsed = createClassSchema.safeParse(req.body);
        if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Invalid input');

        const inviteCode = Math.random().toString(36).substring(2, 9);

        const [createdClass] = await db
            .insert(classes)
            .values({
                ...parsed.data,
                inviteCode,
                schedules: [],
            })
            .returning();

        if (!createdClass) throw new ApiError(500, 'Class could not be created');

        res.status(201).json({ data: createdClass });

    } catch (error) {
        next(error);
    }
});

export default router;
