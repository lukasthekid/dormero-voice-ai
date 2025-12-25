/*
  Warnings:

  - You are about to drop the column `categories` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `dislikes` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `feedbackType` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `overallScore` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Feedback` table. All the data in the column will be lost.
  - Made the column `rating` on table `Feedback` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Feedback_feedbackType_idx";

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "categories",
DROP COLUMN "createdBy",
DROP COLUMN "dislikes",
DROP COLUMN "feedbackType",
DROP COLUMN "likes",
DROP COLUMN "overallScore",
DROP COLUMN "source",
ALTER COLUMN "rating" SET NOT NULL;
