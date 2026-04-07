import express from 'express';
import { db } from '../db/index.js';
import { classes, departments, subjects, user } from '../db/schema/index.js';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { createRateLimitMiddleware } from '../middleware/rate-limit.js';
import { getGlobalRateLimit } from '../lib/ratelimit.js';
import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';

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


router.get('/', globalLimit, async (req, res, next) => {
    try {
        const { search, subject, teacher, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.min(30, Math.max(1, Number(limit) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(classes.name, `%${search}%`),
                    ilike(classes.inviteCode, `%${search}%`)
                )
            )
        }
        if (subject) {
            filterConditions.push(ilike(subjects.name, `%${subject}%`))
        }
        if (teacher) {
            filterConditions.push(ilike(user.name, `%${teacher}%`))
        }
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause);
        const totalCount = Number(countResult[0]?.count ?? 0);
        const classList = await db
            .select({
                ...getTableColumns(classes),
                subject: { id: subjects.id, name: subjects.name, code: subjects.code },
                teacher: { id: user.id, name: user.name, email: user.email, role: user.role },
                department: { id: departments.id, name: departments.name }
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: classList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })

    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    const classId = Number(req.params.id);
    if (!Number.isFinite(classId)) return next(new ApiError(400, 'Invalid class id, No class found'));

    const [classDetails] = await db
        .select({
            ...getTableColumns(classes),
            subject: { ...getTableColumns(subjects) },
            teacher: { ...getTableColumns(user) },
            department: { ...getTableColumns(departments) }
        }).from(classes)
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(eq(classes.id, classId));

    if (!classDetails) return next(new ApiError(404, 'No class found'));
    res.status(200).json({ data: classDetails });
})



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
