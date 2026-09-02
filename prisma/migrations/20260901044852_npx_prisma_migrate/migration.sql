/*
  Warnings:

  - You are about to drop the `BlogPostTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlogTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BlogPostTag" DROP CONSTRAINT "BlogPostTag_postId_fkey";

-- DropForeignKey
ALTER TABLE "BlogPostTag" DROP CONSTRAINT "BlogPostTag_tagId_fkey";

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "keywords" JSONB,
ALTER COLUMN "content" DROP NOT NULL;

-- DropTable
DROP TABLE "BlogPostTag";

-- DropTable
DROP TABLE "BlogTag";
