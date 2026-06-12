import sharp from "sharp";
import path from "path";
import { readFileSync } from "fs";

const LOGO_ASPECT = 281 / 89; // ROX wordmark intrinsic ratio

let logoCache: Buffer | null = null;
function logoBuffer(): Buffer {
  if (!logoCache) {
    logoCache = readFileSync(path.join(process.cwd(), "public/assets/rox-logo.png"));
  }
  return logoCache;
}

/**
 * Stamp the ROX logo onto the bottom-right corner of a generated infographic.
 *
 * The logo sits on a small white rounded plate so it stays legible on any
 * background (white / cobalt / coral / charcoal). Best-effort: on any failure
 * the original image is returned unchanged.
 */
export async function addRoxLogo(image: Buffer): Promise<Buffer> {
  try {
    const base = sharp(image);
    const meta = await base.metadata();
    const W = meta.width ?? 2048;
    const H = meta.height ?? Math.round(W * 9 / 16);

    const logoW = Math.round(W * 0.075);
    const logoH = Math.round(logoW / LOGO_ASPECT);
    const pad = Math.round(logoH * 0.45);
    const plateW = logoW + pad * 2;
    const plateH = logoH + pad * 2;
    const radius = Math.round(plateH * 0.24);
    const margin = Math.round(W * 0.018);

    const resizedLogo = await sharp(logoBuffer())
      .resize(logoW, logoH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const plateSvg = Buffer.from(
      `<svg width="${plateW}" height="${plateH}" xmlns="http://www.w3.org/2000/svg">` +
        `<rect x="0" y="0" width="${plateW}" height="${plateH}" rx="${radius}" ry="${radius}" ` +
        `fill="#ffffff" stroke="#e3ddd4" stroke-width="2"/></svg>`,
    );
    const plate = await sharp(plateSvg)
      .composite([{ input: resizedLogo, left: pad, top: pad }])
      .png()
      .toBuffer();

    return await base
      .composite([{ input: plate, left: W - plateW - margin, top: H - plateH - margin }])
      .png()
      .toBuffer();
  } catch (err) {
    console.warn("addRoxLogo failed; using unbranded image:", err);
    return image;
  }
}
