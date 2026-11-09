/**
 * @file: worker.ts
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { refreshSecurity } from "../modules/security-review/security-review.service.js";
import {
  generateReport,
  sendReport,
} from "../modules/reports/report-generation.service.js";
import { db } from "../shared/db.js";
async function tick() {
  const clients = await db.client.findMany({ where: { archived: false } });
  for (const client of clients) {
    try {
      await refreshSecurity(client.id);
    } catch (error: any) {
      console.error(
        JSON.stringify({
          level: "error",
          clientId: client.id,
          message: error.message,
        }),
      );
      continue;
    }
    const s = client.settings as any;
    if (s.enabled === false) continue;
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: s.timezone || "Atlantic/Canary",
      weekday: "short",
      hour: "numeric",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value;
    if (
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
        get("weekday")!,
      ) !== (s.weekday ?? 5) ||
      Number(get("hour")) !== (s.hour ?? 17)
    )
      continue;
    const period = `${get("year")}-${get("month")}-${get("day")}`;
    if (
      await db.report.findUnique({
        where: { clientId_period: { clientId: client.id, period } },
      })
    )
      continue;
    try {
      const report = await generateReport(client.id, "worker:weekly", period);
      if (s.autoSend) {
        await db.report.update({
          where: { id: report.id },
          data: { status: "approved" },
        });
        await db.auditLog.create({
          data: {
            actorId: "worker:weekly",
            clientId: client.id,
            entityId: report.id,
            action: "report.policy-approved",
          },
        });
        await sendReport(client.id, report.id, "worker:weekly");
      }
    } catch (e: any) {
      if (e.code !== "P2002")
        console.error(
          JSON.stringify({
            level: "error",
            clientId: client.id,
            message: e.message,
          }),
        );
    }
  }
}
let busy = false;
async function run() {
  if (busy) return;
  busy = true;
  try {
    await tick();
  } catch (e: any) {
    console.error(JSON.stringify({ level: "error", message: e.message }));
  } finally {
    busy = false;
  }
}
await run();
setInterval(run, 60000);
