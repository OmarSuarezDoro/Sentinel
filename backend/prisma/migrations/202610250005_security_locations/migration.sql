CREATE TABLE "ClientLocation" (
 "id" TEXT NOT NULL, "clientId" TEXT NOT NULL, "name" TEXT NOT NULL, "kind" TEXT NOT NULL,
 "address" TEXT NOT NULL DEFAULT '', "city" TEXT NOT NULL DEFAULT '', "country" TEXT NOT NULL DEFAULT '',
 "platform" TEXT NOT NULL DEFAULT '', "region" TEXT NOT NULL DEFAULT '', "providerId" TEXT,
 "archived" BOOLEAN NOT NULL DEFAULT false, "version" INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ClientLocation_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ClientLocation_kind_check" CHECK ("kind" IN ('site','cloud'))
);
CREATE UNIQUE INDEX "ClientLocation_id_clientId_key" ON "ClientLocation"("id","clientId");
CREATE UNIQUE INDEX "ClientLocation_clientId_name_key" ON "ClientLocation"("clientId","name");
CREATE INDEX "ClientLocation_clientId_archived_idx" ON "ClientLocation"("clientId","archived");
ALTER TABLE "ClientLocation" ADD CONSTRAINT "ClientLocation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientLocation" ADD CONSTRAINT "ClientLocation_providerId_clientId_fkey" FOREIGN KEY ("providerId","clientId") REFERENCES "Record"("id","clientId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Record" ADD COLUMN "locationId" TEXT;
ALTER TABLE "Record" ADD CONSTRAINT "Record_locationId_clientId_fkey" FOREIGN KEY ("locationId","clientId") REFERENCES "ClientLocation"("id","clientId") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Record_clientId_locationId_idx" ON "Record"("clientId","locationId");
