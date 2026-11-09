/**
 * @file: mail.adapter.ts
 * @description: Contrato o adaptador desacoplado para integraciones externas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
export interface MailMessage {
  subject: string;
  content: string;
  recipients: string[];
}
export interface DeliveryReceipt {
  status: number;
  requestId: string | null;
}
export abstract class MailAdapter {
  abstract assertReady(): void;
  abstract send(message: MailMessage): Promise<DeliveryReceipt>;
}
