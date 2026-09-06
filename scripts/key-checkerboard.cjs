"use strict";

const fs = require("node:fs");
const zlib = require("node:zlib");

const [inputPath, outputPath, ...options] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/key-checkerboard.cjs input.png output.png");
  process.exit(1);
}

const source = fs.readFileSync(inputPath);
const signature = source.subarray(0, 8);
if (!signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("PNG invalide");

let offset = 8;
let width = 0;
let height = 0;
let bitDepth = 0;
let colorType = 0;
const idat = [];
while (offset < source.length) {
  const length = source.readUInt32BE(offset);
  const type = source.toString("ascii", offset + 4, offset + 8);
  const data = source.subarray(offset + 8, offset + 8 + length);
  offset += 12 + length;
  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
    if (data[12] !== 0) throw new Error("PNG entrelacé non pris en charge");
  } else if (type === "IDAT") idat.push(data);
  else if (type === "IEND") break;
}
if (bitDepth !== 8 || ![2, 6].includes(colorType)) throw new Error(`Format PNG non pris en charge: profondeur ${bitDepth}, type ${colorType}`);

const channels = colorType === 6 ? 4 : 3;
const stride = width * channels;
const packed = zlib.inflateSync(Buffer.concat(idat));
const pixels = Buffer.alloc(width * height * channels);
const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};
for (let y = 0, read = 0; y < height; y += 1) {
  const filter = packed[read++];
  const row = y * stride;
  for (let x = 0; x < stride; x += 1) {
    const raw = packed[read++];
    const left = x >= channels ? pixels[row + x - channels] : 0;
    const up = y ? pixels[row - stride + x] : 0;
    const upperLeft = y && x >= channels ? pixels[row - stride + x - channels] : 0;
    const value = filter === 0 ? raw
      : filter === 1 ? raw + left
      : filter === 2 ? raw + up
      : filter === 3 ? raw + Math.floor((left + up) / 2)
      : filter === 4 ? raw + paeth(left, up, upperLeft)
      : NaN;
    if (!Number.isFinite(value)) throw new Error(`Filtre PNG inconnu: ${filter}`);
    pixels[row + x] = value & 255;
  }
}

let rgba = Buffer.alloc(width * height * 4);
for (let index = 0; index < width * height; index += 1) {
  rgba[index * 4] = pixels[index * channels];
  rgba[index * 4 + 1] = pixels[index * channels + 1];
  rgba[index * 4 + 2] = pixels[index * channels + 2];
  rgba[index * 4 + 3] = channels === 4 ? pixels[index * channels + 3] : 255;
}

const background = new Uint8Array(width * height);
const queue = new Uint32Array(width * height);
let head = 0;
let tail = 0;
const looksLikeCheckerboard = index => {
  const p = index * 4;
  const r = rgba[p];
  const g = rgba[p + 1];
  const b = rgba[p + 2];
  return Math.min(r, g, b) >= 224 && Math.max(r, g, b) - Math.min(r, g, b) <= 12;
};
const seed = index => {
  if (background[index] || !looksLikeCheckerboard(index)) return;
  background[index] = 1;
  queue[tail++] = index;
};
for (let x = 0; x < width; x += 1) {
  seed(x);
  seed((height - 1) * width + x);
}
for (let y = 0; y < height; y += 1) {
  seed(y * width);
  seed(y * width + width - 1);
}
while (head < tail) {
  const index = queue[head++];
  const x = index % width;
  const y = Math.floor(index / width);
  if (x) seed(index - 1);
  if (x + 1 < width) seed(index + 1);
  if (y) seed(index - width);
  if (y + 1 < height) seed(index + width);
}

let transparent = 0;
for (let index = 0; index < background.length; index += 1) {
  if (!background[index]) continue;
  rgba[index * 4 + 3] = 0;
  transparent += 1;
}

// Adoucit seulement la frange qui touche le fond détecté; le centre des
// vêtements clairs et les détails du personnage restent opaques.
const touchesBackground = index => {
  const x = index % width;
  const y = Math.floor(index / width);
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && background[ny * width + nx]) return true;
    }
  }
  return false;
};
for (let index = 0; index < background.length; index += 1) {
  if (background[index] || !touchesBackground(index)) continue;
  const p = index * 4;
  const r = rgba[p];
  const g = rgba[p + 1];
  const b = rgba[p + 2];
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const luminance = (r + g + b) / 3;
  if (luminance < 176 || spread > 62) continue;
  const strength = Math.max(spread / 62, (232 - luminance) / 56);
  rgba[p + 3] = Math.max(0, Math.min(255, Math.round(strength * 255)));
}

// Image generators sometimes let a pose cross a nominal atlas boundary. This
// optional pass finds the main silhouettes globally, then recentres each whole
// silhouette inside its grid cell so neighbouring poses cannot bleed through.
const repackOption = options.find(option => option.startsWith("--repack-grid="));
let repackedSilhouettes = 0;
if (repackOption) {
  const match = /^--repack-grid=(\d+)x(\d+)$/.exec(repackOption);
  if (!match) throw new Error(`Grille invalide: ${repackOption}`);
  const columns = Number(match[1]);
  const rows = Number(match[2]);
  if (width % columns || height % rows) throw new Error(`L’image ${width}x${height} ne se divise pas en ${columns}x${rows}`);

  const labels = new Uint16Array(width * height);
  const componentQueue = new Uint32Array(width * height);
  const components = [];
  let label = 0;
  for (let start = 0; start < width * height; start += 1) {
    if (labels[start] || rgba[start * 4 + 3] <= 8) continue;
    label += 1;
    let componentHead = 0;
    let componentTail = 0;
    let count = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    labels[start] = label;
    componentQueue[componentTail++] = start;
    while (componentHead < componentTail) {
      const index = componentQueue[componentHead++];
      const x = index % width;
      const y = Math.floor(index / width);
      count += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      const visit = next => {
        if (labels[next] || rgba[next * 4 + 3] <= 8) return;
        labels[next] = label;
        componentQueue[componentTail++] = next;
      };
      if (x) visit(index - 1);
      if (x + 1 < width) visit(index + 1);
      if (y) visit(index - width);
      if (y + 1 < height) visit(index + width);
    }
    components.push({ label, count, minX, minY, maxX, maxY });
  }

  const expected = columns * rows;
  const silhouettes = components.sort((a, b) => b.count - a.count).slice(0, expected);
  if (silhouettes.length !== expected) throw new Error(`${silhouettes.length} silhouettes trouvées; ${expected} attendues`);
  silhouettes.sort((a, b) => {
    const rowA = Math.floor((a.minY + a.maxY) / 2 / (height / rows));
    const rowB = Math.floor((b.minY + b.maxY) / 2 / (height / rows));
    return rowA - rowB || a.minX - b.minX;
  });

  const cellWidth = width / columns;
  const cellHeight = height / rows;
  // Optional uniform reduction during atlas packing; existing exports keep scale 1.
  const scaleOption = options.find(option => option.startsWith("--sprite-scale="));
  const spriteScale = scaleOption ? Number(scaleOption.split("=")[1]) : 1;
  if (!(spriteScale > 0 && spriteScale <= 1)) throw new Error("Échelle invalide: attendre une valeur entre 0 et 1 inclus");
  const repacked = Buffer.alloc(rgba.length);
  silhouettes.forEach((component, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const silhouetteWidth = Math.ceil((component.maxX - component.minX + 1) * spriteScale);
    const silhouetteHeight = Math.ceil((component.maxY - component.minY + 1) * spriteScale);
    if (silhouetteWidth > cellWidth || silhouetteHeight > cellHeight) {
      throw new Error(`La silhouette ${index + 1} (${silhouetteWidth}x${silhouetteHeight}) dépasse sa cellule ${cellWidth}x${cellHeight}`);
    }
    const targetLeft = column * cellWidth + Math.floor((cellWidth - silhouetteWidth) / 2);
    const targetBottom = row * cellHeight + Math.round(cellHeight * 0.92);
    const targetTop = targetBottom - silhouetteHeight + 1;
    for (let sy = 0; sy < silhouetteHeight; sy += 1) {
      for (let sx = 0; sx < silhouetteWidth; sx += 1) {
        const x = component.minX + Math.floor(sx / spriteScale);
        const y = component.minY + Math.floor(sy / spriteScale);
        const sourceIndex = y * width + x;
        if (labels[sourceIndex] !== component.label) continue;
        const targetX = targetLeft + sx;
        const targetY = targetTop + sy;
        const cellLeft = column * cellWidth;
        const cellTop = row * cellHeight;
        if (targetX < cellLeft || targetX >= cellLeft + cellWidth || targetY < cellTop || targetY >= cellTop + cellHeight) continue;
        rgba.copy(repacked, (targetY * width + targetX) * 4, sourceIndex * 4, sourceIndex * 4 + 4);
      }
    }
  });
  rgba = repacked;
  repackedSilhouettes = silhouettes.length;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = data => {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const name = Buffer.from(type, "ascii");
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  name.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return result;
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const scanlines = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y += 1) rgba.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
fs.writeFileSync(outputPath, Buffer.concat([
  signature,
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]));
console.log(`${width}x${height}, ${transparent} pixels de fond retirés (${(transparent / background.length * 100).toFixed(1)} %)${repackedSilhouettes ? `, ${repackedSilhouettes} silhouettes recentrées` : ""}.`);
