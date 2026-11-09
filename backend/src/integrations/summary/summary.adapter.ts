/**
 * @file: summary.adapter.ts
 * @description: Contrato o adaptador desacoplado para integraciones externas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
export interface SummaryResult {
  content: string;
  model: string;
}
export abstract class SummaryAdapter {
  abstract summarize(
    snapshot: unknown,
    template: string,
  ): Promise<SummaryResult>;
}
