/**
 * @file: architecture.test.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
const root = path.resolve(process.cwd(), "..");
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}
test("los módulos publican rutas, controlador, servicio y pruebas propios", () => {
  for (const name of readdirSync(path.join(root, "backend/src/modules"), {
    withFileTypes: true,
  })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)) {
    for (const suffix of ["routes", "controller", "service", "tests"])
      assert.ok(
        existsSync(
          path.join(root, "backend/src/modules", name, `${name}.${suffix}.ts`),
        ),
        `${name}: falta ${suffix}`,
      );
  }
});
test("los controladores no acceden a persistencia y los servicios no dependen de HTTP", () => {
  for (const file of files(path.join(root, "backend/src/modules"))) {
    const source = readFileSync(file, "utf8");
    if (file.endsWith(".controller.ts"))
      assert.doesNotMatch(source, /from\s+["'][^"']*(?:shared\/db|prisma)["']/);
    if (file.endsWith(".service.ts")) {
      assert.doesNotMatch(source, /from\s+["']express["']/);
      assert.doesNotMatch(
        source,
        /\bfetch\(/,
        "Las llamadas externas pertenecen a adaptadores",
      );
    }
  }
});
test("el código fuente conserva la cabecera corporativa", () => {
  for (const dir of [
    "backend/src",
    "backend/tests",
    "backend/prisma",
    "frontend/src",
  ])
    for (const file of (existsSync(path.join(root, dir))
      ? files(path.join(root, dir))
      : []
    ).filter((f) => /\.(ts|tsx|css)$/.test(f))) {
      const source = readFileSync(file, "utf8");
      assert.ok(source.startsWith("/**\n"), file);
      assert.ok(source.includes("@file: " + path.basename(file)), file);
      assert.ok(
        source.includes("@author: omar.suarez@alturanetgroup.com"),
        file,
      );
      assert.ok(
        source.includes(
          "Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.",
        ),
        file,
      );
    }
});

test("los contratos de entrada están en DTOs y se procesan fuera de los servicios", () => {
  for (const entry of readdirSync(path.join(root, "backend/src/modules"), {
    withFileTypes: true,
  }).filter((e) => e.isDirectory()))
    assert.ok(
      existsSync(
        path.join(
          root,
          "backend/src/modules",
          entry.name,
          `${entry.name}.dtos.ts`,
        ),
      ),
      entry.name,
    );
  for (const file of files(path.join(root, "backend/src/modules"))) {
    const source = readFileSync(file, "utf8");
    if (file.endsWith(".service.ts")) {
      assert.doesNotMatch(source, /from\s+["']zod["']/);
      assert.doesNotMatch(source, /context\.actor\.role/);
      assert.doesNotMatch(source, /argon2\.verify/);
    }
    if (file.endsWith(".controller.ts"))
      assert.doesNotMatch(source, /req\.(body|query|params)/);
  }
});
