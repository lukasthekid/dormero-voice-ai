-- CreateIndex
CREATE INDEX "Call_agentId_startTime_idx" ON "Call"("agentId", "startTime");

-- CreateIndex
CREATE INDEX "Call_status_startTime_idx" ON "Call"("status", "startTime");
