/**
 * @file: integrations.factory.ts
 * @description: Selección de adaptadores de integración mediante variables de entorno
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { AppError } from "../shared/domain.js";
import { DisabledMailAdapter } from "./mail/disabled-mail.adapter.js";
import type { MailAdapter } from "./mail/mail.adapter.js";
import { MicrosoftGraphMailAdapter } from "./microsoft-graph/microsoft-graph-mail.adapter.js";
import { LocalLlmSummaryAdapter } from "./summary/local-llm-summary.adapter.js";
import type { SummaryAdapter } from "./summary/summary.adapter.js";
import { TemplateSummaryAdapter } from "./summary/template-summary.adapter.js";
export interface Integrations {
  summary: SummaryAdapter;
  mail: MailAdapter;
}
export function createIntegrations(
  env: Record<string, string | undefined> = process.env,
): Integrations {
  const summaryName =
      env.SUMMARY_ADAPTER || (env.LOCAL_LLM_URL ? "local-llm" : "template"),
    mailName = env.MAIL_ADAPTER || "microsoft-graph";
  let summary: SummaryAdapter;
  let mail: MailAdapter;
  if (summaryName === "template") summary = new TemplateSummaryAdapter();
  else if (summaryName === "local-llm") {
    if (!env.LOCAL_LLM_URL)
      throw new AppError(
        500,
        "LOCAL_LLM_URL es obligatorio para SUMMARY_ADAPTER=local-llm",
      );
    const url = new URL(env.LOCAL_LLM_URL);
    if (!["http:", "https:"].includes(url.protocol))
      throw new AppError(500, "LOCAL_LLM_URL debe ser HTTP o HTTPS");
    summary = new LocalLlmSummaryAdapter({
      url: url.toString(),
      model: env.LOCAL_LLM_MODEL || "llama3.2",
    });
  } else throw new AppError(500, "SUMMARY_ADAPTER no soportado");
  if (mailName === "microsoft-graph") mail = new MicrosoftGraphMailAdapter(env);
  else if (mailName === "disabled") mail = new DisabledMailAdapter();
  else throw new AppError(500, "MAIL_ADAPTER no soportado");
  return { summary, mail };
}
// La selección de la familia se realiza una vez al iniciar API o worker.
let selected: Integrations | undefined;
function configured() {
  return (selected ||= createIntegrations());
}
// La configuración inválida se diagnostica desde onboarding sin bloquear el acceso a la API.
export const integrations: Integrations = {
  summary: {
    summarize: (snapshot, template) =>
      configured().summary.summarize(snapshot, template),
  },
  mail: {
    assertReady: () => configured().mail.assertReady(),
    send: (message) => configured().mail.send(message),
  },
};
