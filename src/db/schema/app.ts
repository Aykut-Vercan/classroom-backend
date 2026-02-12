
import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";


const timestamps = {
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().$onUpdate(() => new Date()).notNull()
}

export const departments = pgTable('departments', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 250 }).notNull(),
    description: varchar('description', { length: 250 }),
    ...timestamps
});

export const subjects = pgTable('subjects', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 250 }).notNull(),
    departmentId: integer('department_id').notNull().references(() => departments.id, { onDelete: 'restrict' }),
    description: varchar('description', { length: 250 }),
    ...timestamps
});

export const departmentRelations = relations(departments, ({ many }) => ({ subjects: many(subjects) }))

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
    department: one(departments, {
        fields: [subjects.departmentId],
        references: [departments.id]
    })
}))


export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof departments.$inferInsert;

//$inferSelect = bu tabloyu SELECT edince dönecek satırın tipi.

/*
Bu aslında şu ama bunu otomatik çıkarır.
type Department = {
  id: number;
  name: string;
}

 Şunu yazabilmek için kullanılır
 const dept: Department = await db.query.departments.findFirst();
 Ve TypeScript otomatik tip güvenliği sağlar.
*/ 