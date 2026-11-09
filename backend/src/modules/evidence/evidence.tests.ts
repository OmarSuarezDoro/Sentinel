/**
 * @file: evidence.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { attachmentDto } from "./evidence.dtos.js";
test("comprueba la firma del archivo y su contenido real", () => {
  assert.throws(() =>
    attachmentDto.parse({
      name: "fake.pdf",
      mime: "application/pdf",
      base64: Buffer.from("no es PDF").toString("base64"),
    }),
  );
  const value = attachmentDto.parse({
    name: "nota.txt",
    mime: "text/plain",
    base64: Buffer.from("evidencia").toString("base64"),
  });
  assert.equal(value.buffer.toString(), "evidencia");
});
