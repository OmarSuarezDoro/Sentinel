CREATE TABLE "ComplianceAssessment" (
  "id" TEXT NOT NULL, "clientId" TEXT NOT NULL, "framework" TEXT NOT NULL DEFAULT 'nis2', "requirementId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending', "notes" TEXT NOT NULL DEFAULT '', "evidence" TEXT NOT NULL DEFAULT '',
  "evidenceLinks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "relatedIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "owner" TEXT NOT NULL DEFAULT '', "dueAt" TIMESTAMP(3), "taskId" TEXT, "version" INTEGER NOT NULL DEFAULT 1,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewerId" TEXT NOT NULL,
  CONSTRAINT "ComplianceAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceAssessment_status_check" CHECK ("status" IN ('pending','in_progress','implemented','not_applicable')),
  CONSTRAINT "ComplianceAssessment_version_check" CHECK ("version" > 0),
  CONSTRAINT "ComplianceAssessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ComplianceAssessment_taskId_clientId_fkey" FOREIGN KEY ("taskId","clientId") REFERENCES "Record"("id","clientId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ComplianceAssessment_clientId_framework_requirementId_key" ON "ComplianceAssessment"("clientId","framework","requirementId");
CREATE INDEX "ComplianceAssessment_clientId_framework_status_idx" ON "ComplianceAssessment"("clientId","framework","status");
CREATE TABLE "ComplianceSwot" (
  "id" TEXT NOT NULL, "clientId" TEXT NOT NULL, "framework" TEXT NOT NULL DEFAULT 'nis2',
  "strengths" TEXT NOT NULL DEFAULT '', "weaknesses" TEXT NOT NULL DEFAULT '', "opportunities" TEXT NOT NULL DEFAULT '', "threats" TEXT NOT NULL DEFAULT '', "actions" TEXT NOT NULL DEFAULT '',
  "version" INTEGER NOT NULL DEFAULT 1, "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewerId" TEXT NOT NULL,
  CONSTRAINT "ComplianceSwot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceSwot_version_check" CHECK ("version" > 0),
  CONSTRAINT "ComplianceSwot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ComplianceSwot_clientId_framework_key" ON "ComplianceSwot"("clientId","framework");
