import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "public", "products", "catalogue");
const logoPath = path.join(root, "public", "k1-logo.jpeg");

const groups = [
  [
    "nuts",
    "Almonds",
    [
      "Kashmiri Mamra",
      "California Regular",
      "California Sonora",
      "In-shell Kashmiri Regular",
      "Papershell Almonds",
    ],
  ],
  [
    "nuts",
    "Pistachios",
    [
      "Salted Irani Pistachios",
      "Salted California Pistachios",
      "Shelled California Pistachios",
      "Shelled Salted Pistachios",
    ],
  ],
  [
    "nuts",
    "Walnuts",
    [
      "Paper Kashmir Walnuts",
      "Regular Kashmiri Walnuts",
      "Chilean Walnuts",
      "California Walnuts",
      "Snow White Halves",
      "Light Halves",
      "Light Quarters",
    ],
  ],
  [
    "nuts",
    "Speciality Nuts",
    [
      "Raw Hazelnuts",
      "Roasted Hazelnuts",
      "In-shell Macadamia",
      "Shelled Macadamia",
      "In-shell Pine Nuts",
      "Shelled Pine Nuts",
      "In-shell Pecan Nuts",
      "Shelled Pecan Nuts",
    ],
  ],
  ["nuts", "Cashews", ["Cashew W-320", "Cashew W-240", "Cashew W-180"]],
  [
    "dry-fruits-berries",
    "Berries & Fruit",
    [
      "Dried Blueberries",
      "Goji Berries",
      "Cranberries",
      "Dried Cherries",
      "Dried Apricots",
      "Turkish Figs",
      "Afghani Anjeer",
      "Green Raisins",
      "Black Raisins",
    ],
  ],
  [
    "spices-herbs",
    "Spices & Herbs",
    [
      "Kashmiri Saffron",
      "Green Cardamom",
      "Ceylon Cinnamon",
      "Kashmiri Kahwa Herbs",
    ],
  ],
  [
    "cold-pressed-oils",
    "Cold-Pressed Oils",
    ["Walnut Oil", "Almond Oil", "Mustard Oil", "Apricot Kernel Oil"],
  ],
];

const themes = {
  nuts: {
    dark: "#30170b",
    mid: "#8d5627",
    accent: "#d7a64f",
    light: "#f7ead4",
    series: "ORIGIN NUTS",
  },
  "dry-fruits-berries": {
    dark: "#32101f",
    mid: "#7c2947",
    accent: "#d99a9a",
    light: "#f8e7e4",
    series: "ORCHARD SERIES",
  },
  "spices-herbs": {
    dark: "#1f2813",
    mid: "#596129",
    accent: "#d99a28",
    light: "#f3ead5",
    series: "KASHMIR PANTRY",
  },
  "cold-pressed-oils": {
    dark: "#241805",
    mid: "#7d641b",
    accent: "#dab54a",
    light: "#f6ecd4",
    series: "SLOW PRESSED",
  },
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const esc = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function lineBreaks(name, max = 18) {
  const words = name.toUpperCase().split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (!current || `${current} ${word}`.length <= max)
      current = current ? `${current} ${word}` : word;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function textLines(lines, x, y, size, color, weight = 700, gap = 1.02) {
  return `<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-family="Georgia,serif" font-size="${size}" font-weight="${weight}" letter-spacing="1">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? size * gap : 0}">${esc(line)}</tspan>`).join("")}</text>`;
}

function pouchSvg({ name, group, categorySlug, logo, categoryImage }) {
  const theme = themes[categorySlug];
  const lines = lineBreaks(name);
  const longestLine = Math.max(...lines.map((line) => line.length));
  const fontSize = Math.max(28, Math.min(40, Math.floor(520 / longestLine)));
  return `
  <svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.light}"/><stop offset="1" stop-color="${theme.accent}" stop-opacity=".48"/></linearGradient>
      <linearGradient id="pack" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffaf0"/><stop offset=".48" stop-color="#ead4af"/><stop offset="1" stop-color="#b77a3c"/></linearGradient>
      <linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${theme.dark}"/><stop offset=".5" stop-color="${theme.mid}"/><stop offset="1" stop-color="${theme.dark}"/></linearGradient>
      <clipPath id="window"><ellipse cx="500" cy="610" rx="185" ry="128"/></clipPath>
      <clipPath id="logo"><circle cx="500" cy="267" r="71"/></clipPath>
      <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
      <filter id="shadow"><feDropShadow dx="0" dy="24" stdDeviation="20" flood-color="#201007" flood-opacity=".36"/></filter>
    </defs>
    <rect width="1000" height="1000" fill="url(#bg)"/>
    <image href="data:image/png;base64,${categoryImage}" x="-40" y="-40" width="1080" height="1080" preserveAspectRatio="xMidYMid slice" opacity=".16" filter="url(#blur)"/>
    <circle cx="80" cy="95" r="145" fill="none" stroke="${theme.dark}" stroke-opacity=".1" stroke-width="28"/>
    <circle cx="910" cy="900" r="190" fill="none" stroke="${theme.dark}" stroke-opacity=".08" stroke-width="36"/>
    <ellipse cx="500" cy="872" rx="290" ry="48" fill="#281208" opacity=".25" filter="url(#blur)"/>
    <g filter="url(#shadow)">
      <path d="M268 157 Q275 125 315 117 H685 Q725 125 732 157 L756 805 Q752 860 696 876 H304 Q248 860 244 805 Z" fill="url(#pack)" stroke="${theme.dark}" stroke-width="5"/>
      <path d="M272 158 H728 L724 205 H276 Z" fill="url(#side)"/>
      <path d="M286 177 H714" stroke="${theme.accent}" stroke-width="3"/>
      <path d="M301 138 H699" stroke="#f8e8c5" stroke-width="6" opacity=".72"/>
      <rect x="291" y="220" width="418" height="571" rx="18" fill="#fff9ed" stroke="${theme.dark}" stroke-width="3"/>
      <rect x="306" y="235" width="388" height="541" rx="13" fill="none" stroke="${theme.accent}" stroke-width="2"/>
      <image href="data:image/jpeg;base64,${logo}" x="429" y="196" width="142" height="142" clip-path="url(#logo)"/>
      <circle cx="500" cy="267" r="75" fill="none" stroke="${theme.accent}" stroke-width="5"/>
      <text x="500" y="362" text-anchor="middle" fill="${theme.mid}" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="4">${theme.series}</text>
      ${textLines(lines, 500, 420, fontSize, theme.dark)}
      <path d="M362 525 H638" stroke="${theme.accent}" stroke-width="3"/>
      <text x="500" y="553" text-anchor="middle" fill="${theme.mid}" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="3">${esc(group.toUpperCase())} · K1 SELECTED</text>
      <ellipse cx="500" cy="610" rx="190" ry="133" fill="${theme.dark}" stroke="${theme.accent}" stroke-width="5"/>
      <image href="data:image/png;base64,${categoryImage}" x="300" y="470" width="400" height="280" preserveAspectRatio="xMidYMid slice" clip-path="url(#window)"/>
      <ellipse cx="500" cy="610" rx="185" ry="128" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
      <rect x="352" y="753" width="296" height="39" rx="19" fill="${theme.dark}"/>
      <text x="500" y="779" text-anchor="middle" fill="#fff5df" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="3">FRESHNESS SEALED · 250 g</text>
    </g>
    <g transform="translate(827 122)">
      <circle r="78" fill="${theme.dark}" stroke="${theme.accent}" stroke-width="5"/>
      <text y="-7" text-anchor="middle" fill="#fff9e9" font-family="Arial,sans-serif" font-size="30" font-weight="800">50%</text>
      <text y="23" text-anchor="middle" fill="${theme.accent}" font-family="Arial,sans-serif" font-size="17" font-weight="800" letter-spacing="2">OFF MRP</text>
    </g>
    <text x="500" y="945" text-anchor="middle" fill="${theme.dark}" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="5">K1 NUT'S · DELICACY FROM THE HIMALAYAS</text>
  </svg>`;
}

function bottleSvg({ name, group, categorySlug, logo, categoryImage }) {
  const theme = themes[categorySlug];
  const lines = lineBreaks(name, 16);
  const longestLine = Math.max(...lines.map((line) => line.length));
  const fontSize = Math.max(26, Math.min(36, Math.floor(380 / longestLine)));
  return `
  <svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg"><stop stop-color="#fff7df"/><stop offset="1" stop-color="#cda43e"/></radialGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#2b1605"/><stop offset=".22" stop-color="#9c6711"/><stop offset=".46" stop-color="#e0a82d"/><stop offset=".64" stop-color="#7b4508"/><stop offset="1" stop-color="#241304"/></linearGradient>
      <clipPath id="logo"><circle cx="500" cy="416" r="70"/></clipPath>
      <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="shadow"><feDropShadow dx="0" dy="28" stdDeviation="21" flood-color="#1d1004" flood-opacity=".42"/></filter>
    </defs>
    <rect width="1000" height="1000" fill="url(#bg)"/>
    <image href="data:image/png;base64,${categoryImage}" x="-30" y="-30" width="1060" height="1060" preserveAspectRatio="xMidYMid slice" opacity=".18" filter="url(#blur)"/>
    <ellipse cx="500" cy="878" rx="235" ry="47" fill="#241304" opacity=".3" filter="url(#blur)"/>
    <g filter="url(#shadow)">
      <rect x="421" y="105" width="158" height="92" rx="13" fill="#2a1a0b"/>
      <path d="M438 190 H562 V260 Q650 289 657 392 L677 802 Q677 866 613 881 H387 Q323 866 323 802 L343 392 Q350 289 438 260 Z" fill="url(#glass)" stroke="#2b1707" stroke-width="7"/>
      <path d="M397 277 Q366 360 366 762" fill="none" stroke="#ffe6a4" stroke-width="18" opacity=".34" stroke-linecap="round"/>
      <rect x="354" y="338" width="292" height="425" rx="20" fill="#fff8e7" stroke="${theme.dark}" stroke-width="4"/>
      <rect x="369" y="353" width="262" height="395" rx="14" fill="none" stroke="${theme.accent}" stroke-width="2"/>
      <image href="data:image/jpeg;base64,${logo}" x="430" y="346" width="140" height="140" clip-path="url(#logo)"/>
      <circle cx="500" cy="416" r="74" fill="none" stroke="${theme.accent}" stroke-width="4"/>
      <text x="500" y="512" text-anchor="middle" fill="${theme.mid}" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="4">${theme.series}</text>
      ${textLines(lines, 500, 571, fontSize, theme.dark)}
      <path d="M402 671 H598" stroke="${theme.accent}" stroke-width="3"/>
      <text x="500" y="702" text-anchor="middle" fill="${theme.mid}" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="3">${esc(group.toUpperCase())}</text>
      <text x="500" y="732" text-anchor="middle" fill="${theme.dark}" font-family="Arial,sans-serif" font-size="14" font-weight="800" letter-spacing="3">500 ml · AMBER GLASS</text>
    </g>
    <g transform="translate(790 150)">
      <circle r="80" fill="${theme.dark}" stroke="${theme.accent}" stroke-width="5"/>
      <text y="-8" text-anchor="middle" fill="#fff8e5" font-family="Arial,sans-serif" font-size="31" font-weight="800">50%</text>
      <text y="23" text-anchor="middle" fill="${theme.accent}" font-family="Arial,sans-serif" font-size="17" font-weight="800" letter-spacing="2">OFF MRP</text>
    </g>
    <text x="500" y="945" text-anchor="middle" fill="${theme.dark}" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="5">K1 NUT'S · DELICACY FROM THE HIMALAYAS</text>
  </svg>`;
}

await fs.mkdir(outputDir, { recursive: true });
const logo = (await fs.readFile(logoPath)).toString("base64");
let count = 0;

for (const [categorySlug, group, names] of groups) {
  const categoryPath = path.join(
    root,
    "public",
    "categories",
    `${categorySlug}.png`,
  );
  const categoryImage = (await fs.readFile(categoryPath)).toString("base64");
  for (const name of names) {
    const svg =
      categorySlug === "cold-pressed-oils"
        ? bottleSvg({ name, group, categorySlug, logo, categoryImage })
        : pouchSvg({ name, group, categorySlug, logo, categoryImage });
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, palette: false })
      .toFile(path.join(outputDir, `${slugify(name)}.png`));
    count += 1;
  }
}

console.log(`Generated ${count} branded K1 packshots in ${outputDir}`);
