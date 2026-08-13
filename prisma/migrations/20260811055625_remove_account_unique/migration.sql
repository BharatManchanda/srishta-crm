-- DropIndex
DROP INDEX "Account_accountNumber_key";

-- AlterTable
ALTER TABLE "Call" ALTER COLUMN "subject" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "subject" DROP NOT NULL;
