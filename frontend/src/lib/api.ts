/**
 * @file: api.ts
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
let csrf = "";

export async function api(path: string, method = "GET", body?: unknown) {
  const response = await fetch("/api/v1" + path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error?.message || "No se pudo completar la operación",
    );
  if (result.data?.csrf) csrf = result.data.csrf;
  return result;
}
