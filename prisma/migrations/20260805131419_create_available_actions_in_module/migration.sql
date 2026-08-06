-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "availableActions" JSONB;

-- AlterTable
ALTER TABLE "RolePermission" ADD COLUMN     "actions" JSONB;
