/**
 * @file: external-access.tests.ts
 * @description: Pruebas de integridad y alcance de las conexiones VPN
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Prisma } from "@prisma/client";
import {
  accessAttributesDto,
  createExternalAccessDto,
  updateExternalAccessDto,
} from "./external-access.dtos.js";
import { validateAccessReferences } from "./external-access.validation.js";
import { moduleWriteAccess } from "../../middleware/authorization.middleware.js";

const source = "11111111-1111-4111-8111-111111111111";
const target = "22222222-2222-4222-8222-222222222222";
const identityId = "33333333-3333-4333-8333-333333333333";
const providerId = "44444444-4444-4444-8444-444444444444";
const clientId = "test-client";
const base = { title: "VPN corporativa", status: "active", severity: "medium" };
const site = {
  category: "VPN entre sedes",
  sourceLocationId: source,
  targetLocationId: target,
};

function transaction({
  foreignLocation = false,
  invalidIdentity = false,
  invalidProvider = false,
  department = "Sistemas",
} = {}) {
  return {
    clientLocation: {
      findMany: async ({ where }: any) => {
        assert.equal(where.clientId, clientId);
        assert.equal(where.archived, false);
        return foreignLocation ? [] : where.id.in.map((id: string) => ({ id }));
      },
    },
    record: {
      findMany: async ({ where }: any) => {
        assert.equal(where.clientId, clientId);
        assert.equal(where.kind, "assets");
        assert.equal(where.assetType, "identity");
        assert.equal(where.archived, false);
        return invalidIdentity
          ? []
          : where.id.in.map((id: string) => ({ id, data: { department } }));
      },
      findFirst: async ({ where }: any) => {
        assert.equal(where.clientId, clientId);
        assert.equal(where.kind, "providers");
        assert.equal(where.archived, false);
        return invalidProvider ? null : { id: providerId };
      },
    },
  } as unknown as Prisma.TransactionClient;
}

test("las VPN entre sedes requieren dos ubicaciones distintas y no aceptan usuarios", () => {
  assert.equal(
    createExternalAccessDto.safeParse({ ...base, data: site }).success,
    true,
  );
  for (const data of [
    { ...site, sourceLocationId: null },
    { ...site, targetLocationId: source },
    { ...site, identityIds: [identityId] },
    { ...site, providerId },
  ])
    assert.equal(accessAttributesDto.safeParse(data).success, false);
});

test("el acceso de usuarios y el de proveedor tienen relaciones excluyentes", () => {
  assert.equal(
    accessAttributesDto.safeParse({
      category: "VPN de usuarios",
      targetLocationId: target,
    }).success,
    false,
  );
  assert.equal(
    accessAttributesDto.safeParse({
      category: "VPN de proveedor",
      targetLocationId: target,
    }).success,
    false,
  );
  assert.equal(
    accessAttributesDto.safeParse({
      category: "VPN de usuarios",
      targetLocationId: target,
      identityIds: [identityId],
      providerId,
    }).success,
    false,
  );
  assert.equal(
    accessAttributesDto.safeParse({
      category: "VPN de proveedor",
      targetLocationId: target,
      providerId,
      identityIds: [identityId],
    }).success,
    false,
  );
  assert.equal(
    accessAttributesDto.safeParse({
      category: "VPN de usuarios",
      sourceLocationId: source,
      targetLocationId: target,
      identityIds: [identityId],
    }).success,
    false,
  );
});

test("las actualizaciones exigen versión y rechazan atributos secretos o MFA inválido", () => {
  assert.equal(
    updateExternalAccessDto.safeParse({ ...base, data: site }).success,
    false,
  );
  assert.equal(
    updateExternalAccessDto.safeParse({ ...base, version: 1, data: site })
      .success,
    true,
  );
  assert.equal(
    accessAttributesDto.safeParse({ ...site, password: "not-stored" }).success,
    false,
  );
  assert.equal(
    accessAttributesDto.safeParse({ ...site, mfa: "yes" }).success,
    false,
  );
});

test("los extremos VPN deben ser ubicaciones disponibles del cliente", async () => {
  const data = accessAttributesDto.parse(site);
  assert.deepEqual(
    await validateAccessReferences(transaction(), clientId, data),
    [],
  );
  await assert.rejects(
    validateAccessReferences(
      transaction({ foreignLocation: true }),
      clientId,
      data,
    ),
    /ubicaciones/,
  );
});

test("usuarios del cliente, tipo identidad y departamento se comprueban antes de vincular", async () => {
  const data = accessAttributesDto.parse({
    category: "VPN de usuarios",
    targetLocationId: target,
    identityIds: [identityId, identityId],
    department: "Sistemas",
  });
  assert.deepEqual(
    await validateAccessReferences(transaction(), clientId, data),
    [identityId],
  );
  await assert.rejects(
    validateAccessReferences(
      transaction({ invalidIdentity: true }),
      clientId,
      data,
    ),
    /usuarios del inventario/,
  );
  await assert.rejects(
    validateAccessReferences(
      transaction({ department: "Finanzas" }),
      clientId,
      data,
    ),
    /departamento/,
  );
});

test("los proveedores deben ser del cliente y no estar archivados", async () => {
  const data = accessAttributesDto.parse({
    category: "VPN de proveedor",
    targetLocationId: target,
    providerId,
  });
  assert.deepEqual(
    await validateAccessReferences(transaction(), clientId, data),
    [providerId],
  );
  await assert.rejects(
    validateAccessReferences(
      transaction({ invalidProvider: true }),
      clientId,
      data,
    ),
    /proveedor/,
  );
});

test("los auditores pueden consultar pero no modificar accesos externos", () => {
  let error: any;
  moduleWriteAccess("external-access")(
    { user: { role: "auditor" } } as any,
    {} as any,
    (cause) => {
      error = cause;
    },
  );
  assert.equal(error?.status, 403);
  error = null;
  moduleWriteAccess("external-access")(
    { user: { role: "analyst" } } as any,
    {} as any,
    (cause) => {
      error = cause;
    },
  );
  assert.equal(error, undefined);
});
