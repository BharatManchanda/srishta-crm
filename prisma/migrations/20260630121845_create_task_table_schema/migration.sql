-- CreateEnum
CREATE TYPE "PriorityType" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'DEFERRED', 'IN_PROGRESS', 'WAITING_FOR_INPUT');

-- CreateEnum
CREATE TYPE "TaskEntityType" AS ENUM ('LEAD', 'CONTACT', 'ACCOUNT', 'DEAL', 'TASK', 'OPPORTUNITY');

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "entityType" "TaskEntityType",
    "entityId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "dueDate" DATE,
    "priority" "PriorityType" NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "description" TEXT,
    "markAsComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
