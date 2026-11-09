/**
 * @file: seed.ts
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
const db = new PrismaClient();
const email = process.env.ADMIN_EMAIL,
  password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12)
  throw new Error(
    "Configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres)",
  );
try {
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: process.env.ADMIN_NAME || "Administrador MSSP",
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      role: "admin",
    },
  });
  console.log("Administrador preparado:", user.email);
  if (process.env.SEED_DEMO === "true") {
    const client = await db.client.upsert({
      where: { code: "DEMO-001" },
      update: {},
      create: {
        name: "Acme Industries · DEMO",
        legalName: "Acme Industries (datos ficticios)",
        code: "DEMO-001",
        sector: "Industria",
        email: "seguridad@example.com",
      },
    });
    if (!(await db.record.count({ where: { clientId: client.id } })))
      await db.record.createMany({
        data: [
          {
            clientId: client.id,
            kind: "assets",
            assetType: "server",
            title: "SRV-DC01",
            status: "active",
            severity: "critical",
            owner: "Equipo de sistemas",
            data: {
              category: "Servidor",
              hostname: "srv-dc01",
              ip: "10.10.10.10",
              os: "Windows Server 2022",
              environment: "Producción",
              edr: "No",
            },
          },
          {
            clientId: client.id,
            kind: "assets",
            assetType: "network",
            title: "Red de servidores",
            status: "active",
            data: {
              category: "Red",
              cidr: "10.10.10.0/24",
              vrf: "default",
              vlan: 10,
              zone: "Servidores",
            },
          },
          {
            clientId: client.id,
            kind: "vulnerabilities",
            title: "Cuenta privilegiada sin MFA",
            status: "open",
            severity: "critical",
            owner: "Responsable de TI",
            dueAt: new Date(Date.now() - 86400000),
            data: {
              code: "VULN-001",
              description: "Hallazgo ficticio de ejemplo",
              recommendation: "Habilitar MFA y validar acceso",
            },
          },
          {
            clientId: client.id,
            kind: "tasks",
            title: "Desplegar sensor EDR en SRV-DC01",
            status: "pending",
            severity: "high",
            owner: "Equipo de sistemas",
            dueAt: new Date(Date.now() + 3 * 86400000),
            data: { communication: "Pendiente de comunicar" },
          },
          {
            clientId: client.id,
            kind: "security-controls",
            title: "Protección EDR",
            status: "partial",
            severity: "high",
            data: {
              category: "EDR",
              technology: "Solución de demostración",
              covered: 0,
              total: 1,
            },
          },
          {
            clientId: client.id,
            kind: "risks",
            title: "Pérdida de disponibilidad del directorio",
            status: "mitigate",
            severity: "high",
            data: {
              methodology: "MAGERIT (registro cualitativo)",
              methodologyVersion: "1.0",
              dimensions: "D, I, A",
              initial: "Alto",
              residual: "Medio",
              threat: "Acceso no autorizado",
            },
          },
        ],
      });
    console.log("Datos ficticios preparados");
  }
} finally {
  await db.$disconnect();
}
