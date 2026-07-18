-- CreateTable
CREATE TABLE "GoogleCalendar" (
    "id" SERIAL NOT NULL,
    "connectedById" INTEGER NOT NULL,
    "googleId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendar_connectedById_key" ON "GoogleCalendar"("connectedById");

-- AddForeignKey
ALTER TABLE "GoogleCalendar" ADD CONSTRAINT "GoogleCalendar_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
