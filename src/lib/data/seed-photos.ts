/** Lightweight SVG silhouettes for seed garage items (no external assets). */

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const BIKE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none">
  <rect width="640" height="360" fill="#EEF3E8"/>
  <circle cx="160" cy="230" r="70" stroke="#527D31" stroke-width="10"/>
  <circle cx="480" cy="230" r="70" stroke="#527D31" stroke-width="10"/>
  <path d="M160 230 L280 120 H400 L480 230 M280 120 L320 230 M400 120 L320 230" stroke="#1A2226" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M400 120 H460" stroke="#1A2226" stroke-width="10" stroke-linecap="round"/>
</svg>`);

const FRAME = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none">
  <rect width="640" height="360" fill="#F8F7F4"/>
  <path d="M140 250 L260 110 H420 L500 250 M260 110 L330 250 M420 110 L330 250" stroke="#527D31" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="140" cy="250" r="18" fill="#1A2226"/>
  <circle cx="500" cy="250" r="18" fill="#1A2226"/>
</svg>`);

const GROUP = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none">
  <rect width="640" height="360" fill="#EEF2FF"/>
  <circle cx="320" cy="180" r="90" stroke="#1E40AF" stroke-width="14"/>
  <circle cx="320" cy="180" r="28" fill="#1A2226"/>
  <path d="M320 90 V60 M320 270 V300 M230 180 H200 M410 180 H440" stroke="#1A2226" stroke-width="10" stroke-linecap="round"/>
</svg>`);

const WHEEL = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none">
  <rect width="640" height="360" fill="#EEEDE8"/>
  <circle cx="320" cy="180" r="110" stroke="#2A3236" stroke-width="12"/>
  <circle cx="320" cy="180" r="18" fill="#527D31"/>
  <path d="M320 70 V290 M210 180 H430 M245 100 L395 260 M395 100 L245 260" stroke="#737772" stroke-width="4"/>
</svg>`);

const TOOL = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none">
  <rect width="640" height="360" fill="#F8F7F4"/>
  <path d="M180 240 L300 120 L360 180 L240 300 Z" stroke="#527D31" stroke-width="12" stroke-linejoin="round"/>
  <path d="M360 180 L460 100" stroke="#1A2226" stroke-width="14" stroke-linecap="round"/>
</svg>`);

const COVER = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 320" fill="none">
  <defs>
    <pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
      <path d="M0 12 H24" stroke="#2A3236" stroke-width="1.2"/>
    </pattern>
  </defs>
  <rect width="1200" height="320" fill="#1A2226"/>
  <rect width="1200" height="320" fill="url(#p)" opacity="0.55"/>
  <rect x="0" y="250" width="1200" height="70" fill="#10171B" opacity="0.35"/>
</svg>`);

export function seedPhotoForCategory(cat: string): string {
  const c = cat.toUpperCase();
  if (c.includes("FRAME")) return FRAME;
  if (c.includes("GROUP") || c.includes("COMPONENT")) return GROUP;
  if (c.includes("WHEEL")) return WHEEL;
  if (c.includes("TOOL")) return TOOL;
  return BIKE;
}

export const seedGarageCover = COVER;
