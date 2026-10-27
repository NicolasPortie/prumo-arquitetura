/**
 * Gera as variantes responsivas (AVIF + WebP) a partir de media-src/*.png,
 * o manifest com dimensões e cor média (evita salto de layout) e a imagem
 * de compartilhamento. Rode com: npm run media
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "media-src");
const outDir = path.join(root, "static", "media");
const manifestPath = path.join(root, "src", "data", "media-manifest.json");

const WIDTHS = [640, 1100, 1600];

await mkdir(outDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".png")).sort();
const manifest = {};

for (const file of files) {
  const name = file.replace(/\.png$/, "");
  const source = sharp(path.join(sourceDir, file));
  const { width, height } = await source.metadata();
  const { dominant } = await source.clone().stats();
  const color = `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

  const widths = WIDTHS.filter((w) => w < width);
  widths.push(Math.min(width, WIDTHS.at(-1)));

  for (const w of [...new Set(widths)]) {
    const resized = source.clone().resize({ width: w, withoutEnlargement: true });
    await resized.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(outDir, `${name}-${w}.avif`));
    await resized.clone().webp({ quality: 76, effort: 5 }).toFile(path.join(outDir, `${name}-${w}.webp`));
  }

  manifest[name] = { width, height, color, widths: [...new Set(widths)] };
  console.log(`${name}: ${[...new Set(widths)].join("/")}px`);
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

await sharp(path.join(sourceDir, "prumo-patio-conceito-v1.png"))
  .resize(1200, 630, { fit: "cover", position: "attention" })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(outDir, "og-image.jpg"));

console.log("Manifest e og-image.jpg gerados.");
