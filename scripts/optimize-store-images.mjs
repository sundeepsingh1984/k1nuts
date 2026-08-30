import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const roots = [
  "public/categories",
  "public/products",
  "public/products/catalogue",
];

let sourceBytes = 0;
let outputBytes = 0;
let converted = 0;

for (const root of roots) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".png") {
      continue;
    }
    const input = path.join(root, entry.name);
    const output = path.join(root, `${path.basename(entry.name, ".png")}.webp`);
    const metadata = await sharp(input).metadata();
    sourceBytes += metadata.size ?? 0;
    const info = await sharp(input)
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 3, smartSubsample: true })
      .toFile(output);
    outputBytes += info.size;
    converted += 1;
  }
}

console.log(
  `Optimized ${converted} storefront images: ${(sourceBytes / 1024 / 1024).toFixed(1)} MB → ${(outputBytes / 1024 / 1024).toFixed(1)} MB`,
);
