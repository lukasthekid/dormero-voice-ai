/*
  Warnings:

  - You are about to drop the `CallEntity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CallEntity" DROP CONSTRAINT "CallEntity_callId_fkey";

-- DropTable
DROP TABLE "CallEntity";
