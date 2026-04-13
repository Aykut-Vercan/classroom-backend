ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_student_id_class_id_unique";--> statement-breakpoint
ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_student_id_class_id_pk";--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "id" integer PRIMARY KEY NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "enrollments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_student_class_unique" ON "enrollments" USING btree ("student_id","class_id");