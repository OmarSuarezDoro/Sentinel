/**
 * @file: build-sentinel-brand.cjs
 * @description: Exporta el logo generado de Sentinel y su favicon ICO multirresolución
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
const sharp = require("sharp");
const fs = require("node:fs/promises");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const directory = path.join(root, "frontend/public/brand");

async function build() {
  const source = path.join(directory, "sentinel-logo-source.png");
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const runs = [];
  let start = -1;

  for (let x = 0; x <= info.width; x++) {
    let count = 0;
    if (x < info.width)
      for (let y = 0; y < info.height; y++)
        if (data[(y * info.width + x) * 4 + 3] > 96) count++;
    const occupied = count > Math.max(3, info.height * 0.005);
    if (occupied && start < 0) start = x;
    if (!occupied && start >= 0) {
      runs.push([start, x - 1]);
      start = -1;
    }
  }
  if (runs.length < 2 || runs[0][1] > info.width * 0.3)
    throw new Error(
      "No se distingue un símbolo independiente a la izquierda del logo",
    );

  function bounds(left, right) {
    let top = info.height,
      bottom = -1;
    for (let y = 0; y < info.height; y++)
      for (let x = left; x <= right; x++)
        if (data[(y * info.width + x) * 4 + 3] > 96) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    const padding = 8;
    const x = Math.max(0, left - padding),
      y = Math.max(0, top - padding);
    return {
      left: x,
      top: y,
      width: Math.min(info.width, right + padding + 1) - x,
      height: Math.min(info.height, bottom + padding + 1) - y,
    };
  }

  await sharp(source)
    .extract(bounds(runs[0][0], runs.at(-1)[1]))
    .png()
    .toFile(path.join(directory, "sentinel-logo.png"));
  const symbol = await sharp(source)
    .extract(bounds(...runs[0]))
    .png()
    .toBuffer();
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const frames = [];
  for (const size of sizes)
    frames.push(
      await sharp(symbol)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer(),
    );
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, index) => {
    const cursor = 6 + index * 16;
    header[cursor] = size === 256 ? 0 : size;
    header[cursor + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, cursor + 4);
    header.writeUInt16LE(32, cursor + 6);
    header.writeUInt32LE(frames[index].length, cursor + 8);
    header.writeUInt32LE(offset, cursor + 12);
    offset += frames[index].length;
  });
  const ico = Buffer.concat([header, ...frames]);
  await fs.writeFile(path.join(directory, "sentinel.ico"), ico);
  await fs.writeFile(path.join(root, "frontend/src/app/favicon.ico"), ico);
  await sharp(symbol)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(directory, "sentinel-mark.png"));
  console.log(
    "Logo y símbolo PNG exportados. ICO: " + sizes.join(", ") + " px.",
  );
}

build().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
