import express from 'express';
import { getGlobalRateLimit } from "../lib/ratelimit";
import { createRateLimitMiddleware } from '../middleware/rate-limit';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { user } from '../db/schema/index.js';
import { db } from '../db/index.js';

const router = express.Router();
const globalLimit = createRateLimitMiddleware(getGlobalRateLimit);

//get all users with optional search, filtering pagination
router.get('/', globalLimit, async (req, res, next) => {

    try {
        const { search, role, page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.min(50, Math.max(1, Number(limit) || 10));
        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = []
        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`)
                )
            )
        }
        if (role) {
            filterConditions.push(eq(user.role, role as any));
        }
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0);

        const usersList = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                imageCldPubId: user.imageCldPubId,
                createdAt: user.createdAt,
            })
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })

    } catch (e) {
        next(e);
    }

})
export default router;