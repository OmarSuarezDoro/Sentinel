/**
 * @file: onboarding.service.ts
 * @description: Alta inicial atómica, diagnóstico y personalización aislada por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import { inspectEnvironment } from "../../config/environment.js";
import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import type { OperationContext } from "../../shared/operation-context.js";
import type { BootstrapDto, TenantOnboardingDto } from "./onboarding.dtos.js";
export async function setupStatus() {
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    return {
      data: {
        database: "unavailable",
        schema: "unknown",
        initialized: false,
        tokenConfigured: false,
      },
    };
  }
  try {
    const count = await db.user.count();
    return {
      data: {
        database: "ready",
        schema: "ready",
        initialized: count > 0,
        tokenConfigured: (process.env.ONBOARDING_TOKEN?.length || 0) >= 32,
      },
    };
  } catch {
    return {
      data: {
        database: "ready",
        schema: "unavailable",
        initialized: false,
        tokenConfigured: false,
      },
    };
  }
}
export async function bootstrap(input: BootstrapDto) {
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(84190217)`;
    if (await tx.user.count())
      throw new AppError(
        409,
        "La instalación ya tiene usuarios. Inicia sesión para continuar.",
      );
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "admin",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        entityId: user.id,
        action: "installation.bootstrap",
        after: { email: user.email },
      },
    });
  });
  return { data: { created: true } };
}
export async function configuration() {
  const checks = inspectEnvironment(process.env);
  if (await db.user.count()) {
    const token = checks.find((c) => c.key === "ONBOARDING_TOKEN");
    if (token) {
      token.state = "ready";
      token.message = "Alta inicial deshabilitada: ya existen usuarios";
    }
  }
  return { data: { checks, ready: !checks.some((c) => c.state === "error") } };
}
export async function getTenant(context: OperationContext) {
  const settings = context.client!.settings as any;
  return {
    data: {
      profile: settings.personalization || {},
      version: settings.onboardingVersion || 0,
      completedAt: settings.onboardingCompletedAt || null,
    },
  };
}
export async function saveTenant(
  context: OperationContext<TenantOnboardingDto>,
) {
  return {
    data: await db.$transaction(
      async (tx) => {
        const client = await tx.client.findFirst({
          where: { id: context.clientId!, archived: false },
        });
        if (!client) throw new AppError(404, "Tenant no encontrado");
        const settings = client.settings as any;
        if ((settings.onboardingVersion || 0) !== context.input.version)
          throw new AppError(
            409,
            "La configuración ha cambiado. Actualiza la vista.",
          );
        const updated = {
          ...settings,
          personalization: context.input.profile,
          onboardingVersion: context.input.version + 1,
          onboardingCompletedAt: context.input.complete
            ? new Date().toISOString()
            : settings.onboardingCompletedAt || null,
        };
        await tx.client.update({
          where: { id: client.id },
          data: { settings: updated },
        });
        await tx.auditLog.create({
          data: {
            actorId: context.actor.id,
            clientId: client.id,
            entityId: client.id,
            action: "tenant.onboarding",
            before: { profile: settings.personalization || {} },
            after: {
              profile: context.input.profile,
              complete: context.input.complete,
            },
          },
        });
        return {
          profile: updated.personalization,
          version: updated.onboardingVersion,
          completedAt: updated.onboardingCompletedAt,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  };
}
