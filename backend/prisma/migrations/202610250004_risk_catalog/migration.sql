-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "riskDefinitionId" TEXT;

-- CreateTable
CREATE TABLE "RiskDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "threat" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "dimensions" TEXT[],
    "methodology" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "referenceUrl" TEXT NOT NULL DEFAULT '',
    "suggestedControls" TEXT[],
    "defaultSeverity" TEXT NOT NULL DEFAULT 'medium',
    "version" INTEGER NOT NULL DEFAULT 1,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiskDefinition_code_key" ON "RiskDefinition"("code");

-- CreateIndex
CREATE INDEX "RiskDefinition_archived_category_idx" ON "RiskDefinition"("archived", "category");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_riskDefinitionId_fkey" FOREIGN KEY ("riskDefinitionId") REFERENCES "RiskDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Escenarios internos MSSP inspirados en el enfoque de MAGERIT; no son códigos oficiales del catálogo.
INSERT INTO "RiskDefinition" ("id","code","title","category","description","threat","impact","dimensions","methodology","methodologyVersion","referenceUrl","suggestedControls","defaultSeverity","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'MSSP-ACC-01','Acceso no autorizado a sistemas','Acceso e identidades','Un tercero utiliza cuentas o permisos para entrar en sistemas sin autorización.','Compromiso de credenciales, permisos excesivos o fallos de autenticación.','Acceso a información y operaciones del negocio sin autorización.',ARRAY['C','I','A','T'],'MAGERIT','3.0','https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2',ARRAY['MFA','Revisión de accesos','SIEM'],'high',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RiskDefinition" ("id","code","title","category","description","threat","impact","dimensions","methodology","methodologyVersion","referenceUrl","suggestedControls","defaultSeverity","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'MSSP-MAL-01','Interrupción y pérdida de datos por código malicioso','Código malicioso','Código malicioso afecta a equipos, aplicaciones o información de la organización.','Ejecución de malware o ransomware en activos del cliente.','Interrupción de la actividad, pérdida de información y costes de recuperación.',ARRAY['C','I','D'],'MAGERIT','3.0','https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2',ARRAY['EDR','Backup','Parcheado','Segmentación'],'critical',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RiskDefinition" ("id","code","title","category","description","threat","impact","dimensions","methodology","methodologyVersion","referenceUrl","suggestedControls","defaultSeverity","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'MSSP-DIS-01','Indisponibilidad de un servicio crítico','Disponibilidad','Un servicio necesario para la operación deja de estar disponible.','Fallo de infraestructura, saturación o denegación de servicio.','Parada de procesos de negocio e incumplimiento de compromisos de servicio.',ARRAY['D'],'MAGERIT','3.0','https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2',ARRAY['Continuidad de negocio','Monitorización','Redundancia'],'high',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RiskDefinition" ("id","code","title","category","description","threat","impact","dimensions","methodology","methodologyVersion","referenceUrl","suggestedControls","defaultSeverity","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'MSSP-INF-01','Divulgación no autorizada de información','Información','Información del cliente queda accesible a personas no autorizadas.','Exposición de datos, accesos indebidos o errores de compartición.','Pérdida de confidencialidad y perjuicio a las personas o al negocio.',ARRAY['C','T'],'MAGERIT','3.0','https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2',ARRAY['Revisión de accesos','MFA','Clasificación de información'],'high',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RiskDefinition" ("id","code","title","category","description","threat","impact","dimensions","methodology","methodologyVersion","referenceUrl","suggestedControls","defaultSeverity","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'MSSP-OPS-01','Pérdida de capacidad de recuperación','Operación','Las copias o procedimientos no permiten recuperar los servicios y datos previstos.','Copias incompletas, fallos de backup o ausencia de pruebas de restauración.','Pérdida de datos y prolongación del tiempo de interrupción.',ARRAY['I','D'],'MAGERIT','3.0','https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2',ARRAY['Backup','Continuidad de negocio','Pruebas de restauración'],'high',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RiskDefinition" ("id","code","title","category","description","threat","impact","dimensions","methodology","methodologyVersion","referenceUrl","suggestedControls","defaultSeverity","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'MSSP-TER-01','Incidente originado en un proveedor','Terceros','La organización resulta afectada por un incidente en un proveedor o sus accesos.','Compromiso de accesos de terceros o interrupción de un servicio externalizado.','Exposición de información o interrupción de servicios dependientes.',ARRAY['C','I','D','T'],'MAGERIT','3.0','https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2',ARRAY['MFA','Revisión de accesos','Segmentación','Gestión de proveedores'],'high',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RiskDefinition" ("id","code","title","category","description","threat","impact","dimensions","methodology","methodologyVersion","referenceUrl","suggestedControls","defaultSeverity","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'MSSP-OPS-02','Alteración de datos por errores de operación','Operación','Una actuación o configuración incorrecta modifica datos o servicios.','Error humano, cambio no validado o configuración inadecuada.','Información incorrecta, interrupciones y necesidad de reconstruir datos.',ARRAY['I','D','T'],'MAGERIT','3.0','https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2',ARRAY['Control de cambios','Backup','Revisión de configuración'],'medium',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RiskDefinition" ("id","code","title","category","description","threat","impact","dimensions","methodology","methodologyVersion","referenceUrl","suggestedControls","defaultSeverity","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'MSSP-FIS-01','Daño físico a infraestructura tecnológica','Entorno físico','Un suceso físico afecta a los equipos o instalaciones que soportan servicios.','Incendio, inundación, fallo eléctrico o daño a los equipos.','Indisponibilidad de activos y pérdida de información almacenada.',ARRAY['D','I'],'MAGERIT','3.0','https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2',ARRAY['Continuidad de negocio','Protección física','Backup'],'medium',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
