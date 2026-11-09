/**
 * @file: onboarding.ts
 * @description: Asistente local de configuración y diagnóstico previo al arranque
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { readFile, writeFile, chmod, access } from "node:fs/promises";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { inspectEnvironment } from "../backend/src/config/environment.js";

const envPath = resolve(process.cwd(), ".env");
const checking = process.argv.includes("--check");
async function main() {
  let source = "";
  try {
    source = await readFile(envPath, "utf8");
  } catch (error: any) {
    if (error.code !== "ENOENT") throw error;
  }
  let env: Record<string, string>;
  try {
    env = parseEnv(source);
  } catch {
    throw new Error(
      "No se puede interpretar .env. Revisa su sintaxis; no se han modificado datos.",
    );
  }
  const composeChecks = () =>
    ["POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"].filter(
      (key) =>
        !env[key]?.trim() || /^(change-this|replace-with)/.test(env[key]),
    );
  if (checking) {
    for (const key of composeChecks())
      console.log(
        `ERROR ${key}: configura un valor propio para Docker Compose.`,
      );
    const checks = inspectEnvironment(env);
    for (const check of checks)
      console.log(
        `${check.state.toUpperCase()} ${check.key}: ${check.message}`,
      );
    process.exitCode =
      composeChecks().length || checks.some((c) => c.state === "error") ? 1 : 0;
    return;
  }
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error(
      "Ejecuta npm run onboarding en una terminal interactiva, o npm run onboarding:check para diagnosticar.",
    );
  const rl = createInterface({ input: stdin, output: stdout });
  const changes: Record<string, string> = {};
  const set = (key: string, value: string) => {
    env[key] = value;
    changes[key] = value;
  };
  try {
    console.log(
      "Sentinel · Preparación de la instalación\nLos valores existentes se conservan. Las claves no se muestran.",
    );
    const ask = async (label: string, fallback = "") =>
      (
        await rl.question(`${label}${fallback ? ` [${fallback}]` : ""}: `)
      ).trim() || fallback;
    for (const [key, label, fallback] of [
      ["POSTGRES_DB", "Nombre de la base de datos", "mssp"],
      ["POSTGRES_USER", "Usuario PostgreSQL", "mssp"],
    ]) {
      if (!env[key]) {
        let value = "";
        while (!/^[a-zA-Z0-9_]+$/.test(value))
          value = await ask(label, fallback);
        set(key, value);
      }
    }
    if (
      !env.POSTGRES_PASSWORD ||
      /^(change-this|replace-with)/.test(env.POSTGRES_PASSWORD)
    ) {
      let hasDatabase = false;
      try {
        await access(resolve("infrastructure/postgres/data/PG_VERSION"));
        hasDatabase = true;
      } catch (error: any) {
        if (error.code !== "ENOENT")
          throw new Error(
            "No se puede comprobar si ya existen datos PostgreSQL. Revisa los permisos de infrastructure/postgres/data; no se han guardado cambios.",
          );
      }
      if (hasDatabase)
        throw new Error(
          "Ya existe una base PostgreSQL. Restaura POSTGRES_PASSWORD en .env con su contraseña original antes de continuar; el asistente no la cambia.",
        );
      set("POSTGRES_PASSWORD", randomBytes(32).toString("hex"));
    }
    const database = inspectEnvironment(env).find(
      (c) => c.key === "DATABASE_URL",
    );
    if (
      database?.state !== "ready" ||
      changes.POSTGRES_PASSWORD ||
      /change-this/.test(env.DATABASE_URL || "")
    ) {
      const port = await ask(
        "Puerto de PostgreSQL accesible desde el host (para desarrollo)",
        "5432",
      );
      if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
        throw new Error(
          "Puerto PostgreSQL incorrecto; no se han guardado cambios.",
        );
      set(
        "DATABASE_URL",
        `postgresql://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@localhost:${port}/${encodeURIComponent(env.POSTGRES_DB)}`,
      );
    }
    if (
      inspectEnvironment(env).find((c) => c.key === "PORT")?.state !== "ready"
    )
      set("PORT", "4000");
    if (!env.COOKIE_SECURE || !["true", "false"].includes(env.COOKIE_SECURE))
      set("COOKIE_SECURE", "false");
    if (
      inspectEnvironment(env).find((c) => c.key === "INTERNAL_REPORT_EMAIL")
        ?.state !== "ready"
    ) {
      let value = "";
      while (
        inspectEnvironment({ ...env, INTERNAL_REPORT_EMAIL: value }).find(
          (c) => c.key === "INTERNAL_REPORT_EMAIL",
        )?.state !== "ready"
      )
        value = await ask("Único buzón interno para informes");
      set("INTERNAL_REPORT_EMAIL", value);
    }
    if (
      !["template", "local-llm"].includes(env.SUMMARY_ADAPTER || "") ||
      inspectEnvironment(env).some(
        (c) => c.key.startsWith("LOCAL_LLM") && c.state !== "ready",
      )
    )
      set("SUMMARY_ADAPTER", "template");
    if (
      !["microsoft-graph", "disabled"].includes(env.MAIL_ADAPTER || "") ||
      inspectEnvironment(env).some(
        (c) => c.key.startsWith("GRAPH_") && c.state !== "ready",
      )
    )
      set("MAIL_ADAPTER", "disabled");
    if ((env.ONBOARDING_TOKEN?.length || 0) < 32)
      set("ONBOARDING_TOKEN", randomBytes(32).toString("hex"));
    for (const [key, value] of Object.entries(changes)) {
      const line = `${key}='${value.replace(/'/g, "\\'")}'`;
      const pattern = new RegExp(`^${key}=.*$`, "gm");
      source = pattern.test(source)
        ? source.replace(pattern, () => line)
        : source + (source.endsWith("\n") || !source ? "" : "\n") + line + "\n";
    }
    await writeFile(envPath, source, { mode: 0o600 });
    await chmod(envPath, 0o600);
    console.log(
      "\nConfiguración guardada en .env (permisos 600). Variables preparadas: " +
        (Object.keys(changes).join(", ") || "ninguna; ya eran válidas"),
    );
    console.log(
      "Ejecuta docker compose up -d --build para cargarla. Abre http://localhost:8080 y completa el alta inicial con ONBOARDING_TOKEN de .env. Si ya existen usuarios, inicia sesión y abre Onboarding.",
    );
    console.log(
      "DATABASE_URL es para comandos en el host; Compose conecta a su PostgreSQL interno. El asistente no migra ni elimina datos.",
    );
  } finally {
    rl.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
