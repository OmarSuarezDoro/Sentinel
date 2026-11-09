/**
 * @file: template-summary.adapter.ts
 * @description: Contrato o adaptador desacoplado para integraciones externas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { SummaryAdapter, type SummaryResult } from "./summary.adapter.js";
export class TemplateSummaryAdapter extends SummaryAdapter {
  async summarize(
    _snapshot: unknown,
    template: string,
  ): Promise<SummaryResult> {
    return { content: template, model: "template-v1" };
  }
}
