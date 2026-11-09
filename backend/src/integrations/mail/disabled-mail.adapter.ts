/**
 * @file: disabled-mail.adapter.ts
 * @description: Contrato o adaptador desacoplado para integraciones externas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { AppError } from "../../shared/domain.js";
import {
  MailAdapter,
  type DeliveryReceipt,
  type MailMessage,
} from "./mail.adapter.js";
export class DisabledMailAdapter extends MailAdapter {
  assertReady(): never {
    throw new AppError(503, "El envío de correo está deshabilitado");
  }
  async send(_message: MailMessage): Promise<DeliveryReceipt> {
    return this.assertReady();
  }
}
