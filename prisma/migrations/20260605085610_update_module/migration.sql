/*
  Warnings:

  - You are about to drop the column `slug` on the `Module` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[path]` on the table `Module` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `path` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sort_order` to the `Module` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Module_slug_key";

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "slug",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "parent_id" INTEGER,
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "sort_order" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Module_path_key" ON "Module"("path");
