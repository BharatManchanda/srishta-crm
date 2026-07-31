-- CreateEnum
CREATE TYPE "WhatsappEntityType" AS ENUM ('LEAD', 'CONTACT', 'ACCOUNT');

-- CreateTable
CREATE TABLE "WhatsappContactLink" (
    "id" SERIAL NOT NULL,
    "whatsappContactId" INTEGER NOT NULL,
    "entityType" "WhatsappEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappContactLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsappContactLink_entityType_entityId_idx" ON "WhatsappContactLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WhatsappContactLink_whatsappContactId_idx" ON "WhatsappContactLink"("whatsappContactId");

-- AddForeignKey
ALTER TABLE "WhatsappContactLink" ADD CONSTRAINT "WhatsappContactLink_whatsappContactId_fkey" FOREIGN KEY ("whatsappContactId") REFERENCES "WhatsappContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
