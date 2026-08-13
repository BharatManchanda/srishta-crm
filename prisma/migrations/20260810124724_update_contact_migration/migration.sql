-- DropIndex
DROP INDEX "Contact_email_key";

-- DropIndex
DROP INDEX "Contact_phone_key";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "accountName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MeetingParticipant" ALTER COLUMN "meetingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "priority" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL;
