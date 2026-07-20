-- CreateTable
CREATE TABLE "CalendarSyncRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "googleEventId" TEXT,
    "syncStatus" "GoogleSyncStatus" NOT NULL DEFAULT 'PENDING',
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSyncRecord_userId_entityType_entityId_key" ON "CalendarSyncRecord"("userId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "CalendarSyncRecord" ADD CONSTRAINT "CalendarSyncRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
