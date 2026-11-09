/**
 * @file: environment.ts
 * @description: Diagnóstico de configuración sin exposición de valores ni secretos
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export interface ConfigurationCheck {
  key: string;
  state: "ready" | "warning" | "error";
  message: string;
}
const email = z.email();
export function inspectEnvironment(env: Record<string, string | undefined>) {
  const checks: ConfigurationCheck[] = [];
  const check = (
    key: string,
    valid: boolean,
    message: string,
    optional = false,
  ) =>
    checks.push({
      key,
      state: valid ? "ready" : optional ? "warning" : "error",
      message: valid ? "Configuración válida" : message,
    });
  let database = false;
  try {
    const url = new URL(env.DATABASE_URL || "");
    database =
      ["postgresql:", "postgres:"].includes(url.protocol) &&
      !!url.hostname &&
      !!url.pathname.slice(1) &&
      !!url.username &&
      !!url.password;
  } catch {}
  check(
    "DATABASE_URL",
    database,
    "Define una conexión PostgreSQL con usuario, contraseña, servidor y base de datos.",
  );
  check(
    "PORT",
    !env.PORT ||
      (/^\d+$/.test(env.PORT) &&
        Number(env.PORT) >= 1 &&
        Number(env.PORT) <= 65535),
    "Usa un puerto entre 1 y 65535.",
  );
  check(
    "COOKIE_SECURE",
    !env.COOKIE_SECURE || ["true", "false"].includes(env.COOKIE_SECURE),
    "Usa true con HTTPS o false en el entorno local.",
  );
  check(
    "INTERNAL_REPORT_EMAIL",
    email.safeParse(env.INTERNAL_REPORT_EMAIL?.trim() || "").success,
    "Define un único buzón interno válido. Los informes permanecerán bloqueados.",
    true,
  );
  const summary =
    env.SUMMARY_ADAPTER || (env.LOCAL_LLM_URL ? "local-llm" : "template");
  check(
    "SUMMARY_ADAPTER",
    ["template", "local-llm"].includes(summary),
    "Selecciona template o local-llm.",
  );
  if (summary === "local-llm") {
    let valid = false;
    try {
      const url = new URL(env.LOCAL_LLM_URL || "");
      valid =
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password;
    } catch {}
    check(
      "LOCAL_LLM_URL",
      valid,
      "Configura una URL HTTP/HTTPS privada válida o selecciona template.",
    );
    check(
      "LOCAL_LLM_MODEL",
      !!env.LOCAL_LLM_MODEL?.trim(),
      "Indica el modelo local.",
    );
  }
  const mail = env.MAIL_ADAPTER || "microsoft-graph";
  check(
    "MAIL_ADAPTER",
    ["microsoft-graph", "disabled"].includes(mail),
    "Selecciona microsoft-graph o disabled.",
  );
  if (mail === "microsoft-graph") {
    for (const key of [
      "GRAPH_TENANT_ID",
      "GRAPH_CLIENT_ID",
      "GRAPH_CLIENT_SECRET",
    ])
      check(
        key,
        !!env[key]?.trim(),
        "Completa las credenciales de Microsoft 365 o desactiva el envío.",
        true,
      );
    check(
      "GRAPH_SENDER",
      email.safeParse(env.GRAPH_SENDER?.trim() || "").success,
      "Configura un buzón remitente válido.",
      true,
    );
  }
  check(
    "ONBOARDING_TOKEN",
    (env.ONBOARDING_TOKEN?.length || 0) >= 32,
    "Ejecuta npm run onboarding para habilitar el alta inicial protegida.",
    true,
  );
  return checks;
}
