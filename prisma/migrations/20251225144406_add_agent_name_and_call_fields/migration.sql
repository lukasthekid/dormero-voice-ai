-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "agentName" TEXT,
ADD COLUMN     "callCharge" INTEGER,
ADD COLUMN     "callSummary" TEXT,
ADD COLUMN     "llmPrice" DOUBLE PRECISION,
ADD COLUMN     "messages" INTEGER NOT NULL DEFAULT 0;
