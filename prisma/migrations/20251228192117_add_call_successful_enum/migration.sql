/*
  Warnings:

  - The `callSuccessful` column on the `Call` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CallSuccessful" AS ENUM ('success', 'failure', 'unknown');

-- AlterTable
ALTER TABLE "Call" DROP COLUMN "callSuccessful",
ADD COLUMN     "callSuccessful" "CallSuccessful";

-- CreateIndex
CREATE INDEX "Call_callSuccessful_idx" ON "Call"("callSuccessful");
