import express from 'express';
import { getGlobalRateLimit } from "../lib/ratelimit";
import { createRateLimitMiddleware } from '../middleware/rate-limit';
import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import { classes, departments, enrollments, subjects, user } from '../db/schema/index.js';
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

router.get('/:id', async (req, res, next) => {
    try {
        const userId = req.params.id;
        const [userRecord] = await db
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
            .where(eq(user.id, userId));

        if (!userRecord) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ data: userRecord });
    } catch (e) {
        next(e);
    }
});

// Get departments associated with a user (teacher: via classes, student: via enrollments)
router.get('/:id/departments', async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Number(limit) || 10);
        const offset = (currentPage - 1) * limitPerPage;

        const [userRecord] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
        if (!userRecord) return res.status(404).json({ error: 'User not found' });

        const baseQuery = userRecord.role === 'teacher'
            ? db.selectDistinct({ ...getTableColumns(departments) })
                .from(departments)
                .innerJoin(subjects, eq(subjects.departmentId, departments.id))
                .innerJoin(classes, eq(classes.subjectId, subjects.id))
                .where(eq(classes.teacherId, userId))
            : db.selectDistinct({ ...getTableColumns(departments) })
                .from(departments)
                .innerJoin(subjects, eq(subjects.departmentId, departments.id))
                .innerJoin(classes, eq(classes.subjectId, subjects.id))
                .innerJoin(enrollments, eq(enrollments.classId, classes.id))
                .where(eq(enrollments.studentId, userId));

        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(baseQuery.as('sub'));
        const totalCount = Number(countResult[0]?.count ?? 0);

        const departmentsList = await baseQuery
            .orderBy(desc(departments.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: departmentsList,
            pagination: { page: currentPage, limit: limitPerPage, total: totalCount, totalPages: Math.ceil(totalCount / limitPerPage) }
        });
    } catch (e) {
        next(e);
    }
});

// Get subjects associated with a user (teacher: via classes, student: via enrollments)
router.get('/:id/subjects', async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Number(limit) || 10);
        const offset = (currentPage - 1) * limitPerPage;

        const [userRecord] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
        if (!userRecord) return res.status(404).json({ error: 'User not found' });

        const baseQuery = userRecord.role === 'teacher'
            ? db.selectDistinct({
                ...getTableColumns(subjects),
                department: { id: departments.id, name: departments.name, code: departments.code }
            })
                .from(subjects)
                .innerJoin(classes, eq(classes.subjectId, subjects.id))
                .leftJoin(departments, eq(subjects.departmentId, departments.id))
                .where(eq(classes.teacherId, userId))
            : db.selectDistinct({
                ...getTableColumns(subjects),
                department: { id: departments.id, name: departments.name, code: departments.code }
            })
                .from(subjects)
                .innerJoin(classes, eq(classes.subjectId, subjects.id))
                .innerJoin(enrollments, eq(enrollments.classId, classes.id))
                .leftJoin(departments, eq(subjects.departmentId, departments.id))
                .where(eq(enrollments.studentId, userId));

        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(baseQuery.as('sub'));
        const totalCount = Number(countResult[0]?.count ?? 0);

        const subjectsList = await baseQuery
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: { page: currentPage, limit: limitPerPage, total: totalCount, totalPages: Math.ceil(totalCount / limitPerPage) }
        });
    } catch (e) {
        next(e);
    }
});

export default router;