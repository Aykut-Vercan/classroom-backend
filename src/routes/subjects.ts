import express from 'express';
import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import { departments, subjects } from '../db/schema';
import { db } from '../db';

const router = express.Router();

//get all subjects with optional search, filtering pagination
router.get('/', async (req, res) => {
    try {
        const { search, department, page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.min(50, Math.max(1, Number(limit) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = []

        //name or code filter
        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`)
                )
            )
        }
        if (department) {
            filterConditions.push(ilike(departments.name, `%${department}%`))
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0)

        const subjectList = await db.select({
            ...getTableColumns(subjects),
            department: { ...getTableColumns(departments) }
        })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: subjectList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })

    } catch (err) {
        console.error(`Get /subjects error:${err}`);
        res.status(500).json({ error: 'Failed to get subjects' })
    }
})

export default router;