-- CreateEnum
CREATE TYPE "PricingCategory" AS ENUM ('CRM', 'COMMUNICATION', 'MARKETING', 'AUTOMATION_ANALYTICS', 'SUPPORT_SECURITY', 'ADMINISTRATION');

-- CreateEnum
CREATE TYPE "PricingPlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "pricingCategory" "PricingCategory",
ADD COLUMN     "pricingDescription" TEXT,
ADD COLUMN     "pricingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricingLabel" TEXT,
ADD COLUMN     "pricingOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "yearlyPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PricingPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "cta" TEXT NOT NULL DEFAULT 'Get Started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanModule" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "limit" INTEGER,
    "displayValue" TEXT,
    "featureLabel" TEXT,
    "featureDescription" TEXT,
    "actions" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlanModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_name_key" ON "PricingPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_slug_key" ON "PricingPlan"("slug");

-- CreateIndex
CREATE INDEX "PlanModule_planId_idx" ON "PlanModule"("planId");

-- CreateIndex
CREATE INDEX "PlanModule_moduleId_idx" ON "PlanModule"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanModule_planId_moduleId_key" ON "PlanModule"("planId", "moduleId");

-- AddForeignKey
ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
