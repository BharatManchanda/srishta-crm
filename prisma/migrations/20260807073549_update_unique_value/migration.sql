/*
  Warnings:

  - A unique constraint covering the columns `[moduleId,name]` on the table `ModuleField` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ModuleField_moduleId_name_key" ON "ModuleField"("moduleId", "name");
