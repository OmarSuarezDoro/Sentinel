/**
 * @file: microsoft-graph-mail.adapter.ts
 * @description: Contrato o adaptador desacoplado para integraciones externas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import {
  internalRecipients,
  assertInternalRecipients,
} from "../mail/internal-mail.policy.js";
import { AppError } from "../../shared/domain.js";
import {
  MailAdapter,
  type DeliveryReceipt,
  type MailMessage,
} from "../mail/mail.adapter.js";
export class MicrosoftGraphMailAdapter extends MailAdapter {
  constructor(
    private readonly config: Record<string, string | undefined>,
    private readonly transport: typeof fetch = (...args) => fetch(...args),
  ) {
    super();
  }
  assertReady() {
    internalRecipients(this.config);
    if (
      [
        "GRAPH_TENANT_ID",
        "GRAPH_CLIENT_ID",
        "GRAPH_CLIENT_SECRET",
        "GRAPH_SENDER",
      ].some((key) => !this.config[key])
    )
      throw new AppError(503, "Microsoft Graph no está configurado");
  }
  async send(message: MailMessage): Promise<DeliveryReceipt> {
    const recipients = assertInternalRecipients(
      message.recipients,
      this.config,
    );
    this.assertReady();
    const tokenResponse = await this.transport(
      `https://login.microsoftonline.com/${encodeURIComponent(this.config.GRAPH_TENANT_ID!)}/oauth2/v2.0/token`,
      {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        body: new URLSearchParams({
          client_id: this.config.GRAPH_CLIENT_ID!,
          client_secret: this.config.GRAPH_CLIENT_SECRET!,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      },
    );
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !token.access_token)
      throw new Error("No se pudo autenticar Microsoft Graph");
    const response = await this.transport(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(this.config.GRAPH_SENDER!)}/sendMail`,
      {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: message.subject,
            body: { contentType: "Text", content: message.content },
            toRecipients: recipients.map((address) => ({
              emailAddress: { address },
            })),
          },
          saveToSentItems: true,
        }),
      },
    );
    if (!response.ok)
      throw new Error(`Microsoft Graph HTTP ${response.status}`);
    return {
      status: response.status,
      requestId: response.headers.get("request-id"),
    };
  }
}
