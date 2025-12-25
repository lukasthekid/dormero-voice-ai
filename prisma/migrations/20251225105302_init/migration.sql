-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "branchId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL,
    "terminationReason" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "acceptedTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3) NOT NULL,
    "callDurationSecs" INTEGER NOT NULL,
    "transcript" JSONB NOT NULL,
    "transcriptSummary" TEXT,
    "callSummaryTitle" TEXT,
    "mainLanguage" TEXT NOT NULL DEFAULT 'en',
    "callSuccessful" TEXT,
    "userTurnCount" INTEGER NOT NULL DEFAULT 0,
    "agentTurnCount" INTEGER NOT NULL DEFAULT 0,
    "totalTurnCount" INTEGER NOT NULL DEFAULT 0,
    "cost" INTEGER,
    "llmCost" DOUBLE PRECISION,
    "initiationSource" TEXT,
    "initiationSourceVersion" TEXT,
    "initiatorId" TEXT,
    "timezone" TEXT,
    "featuresUsed" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "rating" SMALLINT,
    "overallScore" SMALLINT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "feedbackType" TEXT,
    "categories" TEXT[],
    "createdBy" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallEntity" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityValue" TEXT NOT NULL,
    "confidence" REAL,
    "turnIndex" INTEGER,
    "extractedBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMetrics" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "successfulCalls" INTEGER NOT NULL DEFAULT 0,
    "failedCalls" INTEGER NOT NULL DEFAULT 0,
    "averageDurationSecs" REAL,
    "averageRating" REAL,
    "averageTurns" REAL,
    "totalCostCents" INTEGER NOT NULL DEFAULT 0,
    "totalLlmCost" REAL NOT NULL DEFAULT 0,
    "lastCallAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAnalytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "agentId" TEXT,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "successfulCalls" INTEGER NOT NULL DEFAULT 0,
    "failedCalls" INTEGER NOT NULL DEFAULT 0,
    "avgDurationSecs" REAL,
    "avgRating" REAL,
    "avgTurns" REAL,
    "totalCostCents" INTEGER NOT NULL DEFAULT 0,
    "totalLlmCost" REAL NOT NULL DEFAULT 0,
    "topHotels" TEXT[],
    "topLocations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Call_conversationId_key" ON "Call"("conversationId");

-- CreateIndex
CREATE INDEX "Call_agentId_idx" ON "Call"("agentId");

-- CreateIndex
CREATE INDEX "Call_userId_idx" ON "Call"("userId");

-- CreateIndex
CREATE INDEX "Call_startTime_idx" ON "Call"("startTime");

-- CreateIndex
CREATE INDEX "Call_status_idx" ON "Call"("status");

-- CreateIndex
CREATE INDEX "Call_callSuccessful_idx" ON "Call"("callSuccessful");

-- CreateIndex
CREATE INDEX "Call_conversationId_idx" ON "Call"("conversationId");

-- CreateIndex
CREATE INDEX "Feedback_callId_idx" ON "Feedback"("callId");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "Feedback_feedbackType_idx" ON "Feedback"("feedbackType");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "CallEntity_callId_idx" ON "CallEntity"("callId");

-- CreateIndex
CREATE INDEX "CallEntity_entityType_idx" ON "CallEntity"("entityType");

-- CreateIndex
CREATE INDEX "CallEntity_entityValue_idx" ON "CallEntity"("entityValue");

-- CreateIndex
CREATE INDEX "CallEntity_callId_entityType_idx" ON "CallEntity"("callId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMetrics_agentId_key" ON "AgentMetrics"("agentId");

-- CreateIndex
CREATE INDEX "AgentMetrics_agentId_idx" ON "AgentMetrics"("agentId");

-- CreateIndex
CREATE INDEX "AgentMetrics_lastCallAt_idx" ON "AgentMetrics"("lastCallAt");

-- CreateIndex
CREATE INDEX "DailyAnalytics_date_idx" ON "DailyAnalytics"("date");

-- CreateIndex
CREATE INDEX "DailyAnalytics_agentId_idx" ON "DailyAnalytics"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAnalytics_date_agentId_key" ON "DailyAnalytics"("date", "agentId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEntity" ADD CONSTRAINT "CallEntity_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
