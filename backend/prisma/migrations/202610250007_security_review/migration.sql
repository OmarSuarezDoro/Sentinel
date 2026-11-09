/**
 * @file: migration.sql
 * @description: Comprobaciones de seguridad y tareas automáticas sin duplicados
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
BEGIN;
CREATE TABLE "SecurityDecision" ("id" TEXT NOT NULL,"clientId" TEXT NOT NULL,"ruleId" TEXT NOT NULL,"state" TEXT NOT NULL,"notes" TEXT NOT NULL,"actorId" TEXT NOT NULL,"reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"version" INTEGER NOT NULL DEFAULT 1,CONSTRAINT "SecurityDecision_pkey" PRIMARY KEY ("id"),CONSTRAINT "SecurityDecision_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,CONSTRAINT "SecurityDecision_state_check" CHECK ("state" IN ('unknown','implemented','absent','not_applicable')));
CREATE UNIQUE INDEX "SecurityDecision_clientId_ruleId_key" ON "SecurityDecision"("clientId","ruleId");
ALTER TABLE "Record" ADD COLUMN "automationKey" TEXT;
CREATE UNIQUE INDEX "Record_clientId_kind_automationKey_key" ON "Record"("clientId","kind","automationKey");
-- Las decisiones de envío anteriores dejan de ser una fuente de destinatarios.
UPDATE "Client" SET settings=settings-'recipients';
UPDATE "Report" SET recipients=ARRAY[]::TEXT[],status=CASE WHEN status='approved' THEN 'draft' ELSE status END WHERE status IN ('draft','approved');
COMMIT;
