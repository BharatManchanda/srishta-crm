-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'COMPLETED';

-- Migrate existing data
UPDATE "Task" SET "status" = 'COMPLETED' WHERE "markAsComplete" = true;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "markAsComplete";
