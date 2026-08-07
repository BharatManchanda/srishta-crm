/*
  Warnings:

  - A unique constraint covering the columns `[moduleId,name,createdById]` on the table `ModuleField` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ModuleField_moduleId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "ModuleField_moduleId_name_createdById_key" ON "ModuleField"("moduleId", "name", "createdById");
