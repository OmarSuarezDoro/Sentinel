-- CreateTable
CREATE TABLE "Account" (
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "authentication" TEXT NOT NULL,
    "mfa" TEXT NOT NULL,
    "privileges" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "reviewedAt" TIMESTAMP(3),
    "reviewer" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessGrant" (
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "privileges" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'review',
    "authorizedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reviewer" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAccess" (
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "assetId" TEXT,
    "system" TEXT NOT NULL,
    "authentication" TEXT NOT NULL,
    "mfa" TEXT NOT NULL,
    "privileges" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'review',
    "authorizedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reviewer" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ProviderAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlDeployment" (
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "effective" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ControlDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkInterface" (
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "NetworkInterface_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkLink" (
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sourceNetworkId" TEXT NOT NULL,
    "targetNetworkId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "NetworkLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "vlanId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Vlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsibility" (
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "assignment" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDocument" (
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportItem" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "communicatedAt" TIMESTAMP(3),

    CONSTRAINT "ReportItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDelivery" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipients" TEXT[],
    "response" JSONB,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_clientId_identityId_status_idx" ON "Account"("clientId", "identityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Account_id_clientId_key" ON "Account"("id", "clientId");

-- CreateIndex
CREATE INDEX "AccessGrant_clientId_identityId_status_idx" ON "AccessGrant"("clientId", "identityId", "status");

-- CreateIndex
CREATE INDEX "ProviderAccess_clientId_providerId_status_idx" ON "ProviderAccess"("clientId", "providerId", "status");

-- CreateIndex
CREATE INDEX "ControlDeployment_clientId_effective_idx" ON "ControlDeployment"("clientId", "effective");

-- CreateIndex
CREATE UNIQUE INDEX "ControlDeployment_controlId_assetId_key" ON "ControlDeployment"("controlId", "assetId");

-- CreateIndex
CREATE INDEX "NetworkInterface_clientId_assetId_idx" ON "NetworkInterface"("clientId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkInterface_networkId_address_key" ON "NetworkInterface"("networkId", "address");

-- CreateIndex
CREATE INDEX "NetworkLink_clientId_sourceNetworkId_idx" ON "NetworkLink"("clientId", "sourceNetworkId");

-- CreateIndex
CREATE UNIQUE INDEX "Vlan_networkId_key" ON "Vlan"("networkId");

-- CreateIndex
CREATE INDEX "Vlan_clientId_vlanId_idx" ON "Vlan"("clientId", "vlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Vlan_networkId_clientId_key" ON "Vlan"("networkId", "clientId");

-- CreateIndex
CREATE INDEX "Responsibility_clientId_providerId_idx" ON "Responsibility"("clientId", "providerId");

-- CreateIndex
CREATE INDEX "ClientDocument_clientId_idx" ON "ClientDocument"("clientId");

-- CreateIndex
CREATE INDEX "ReportItem_clientId_recordId_communicatedAt_idx" ON "ReportItem"("clientId", "recordId", "communicatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportItem_reportId_recordId_key" ON "ReportItem"("reportId", "recordId");

-- CreateIndex
CREATE INDEX "ReportDelivery_clientId_reportId_idx" ON "ReportDelivery"("clientId", "reportId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_id_clientId_key" ON "Report"("id", "clientId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_identityId_clientId_fkey" FOREIGN KEY ("identityId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_accountId_clientId_fkey" FOREIGN KEY ("accountId", "clientId") REFERENCES "Account"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_identityId_clientId_fkey" FOREIGN KEY ("identityId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAccess" ADD CONSTRAINT "ProviderAccess_providerId_clientId_fkey" FOREIGN KEY ("providerId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAccess" ADD CONSTRAINT "ProviderAccess_assetId_clientId_fkey" FOREIGN KEY ("assetId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlDeployment" ADD CONSTRAINT "ControlDeployment_controlId_clientId_fkey" FOREIGN KEY ("controlId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlDeployment" ADD CONSTRAINT "ControlDeployment_assetId_clientId_fkey" FOREIGN KEY ("assetId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkInterface" ADD CONSTRAINT "NetworkInterface_networkId_clientId_fkey" FOREIGN KEY ("networkId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkInterface" ADD CONSTRAINT "NetworkInterface_assetId_clientId_fkey" FOREIGN KEY ("assetId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLink" ADD CONSTRAINT "NetworkLink_sourceNetworkId_clientId_fkey" FOREIGN KEY ("sourceNetworkId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkLink" ADD CONSTRAINT "NetworkLink_targetNetworkId_clientId_fkey" FOREIGN KEY ("targetNetworkId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vlan" ADD CONSTRAINT "Vlan_networkId_clientId_fkey" FOREIGN KEY ("networkId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_providerId_clientId_fkey" FOREIGN KEY ("providerId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportItem" ADD CONSTRAINT "ReportItem_reportId_clientId_fkey" FOREIGN KEY ("reportId", "clientId") REFERENCES "Report"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportItem" ADD CONSTRAINT "ReportItem_recordId_clientId_fkey" FOREIGN KEY ("recordId", "clientId") REFERENCES "Record"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDelivery" ADD CONSTRAINT "ReportDelivery_reportId_clientId_fkey" FOREIGN KEY ("reportId", "clientId") REFERENCES "Report"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

