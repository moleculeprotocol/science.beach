// Simplex Noise 3D — based on https://github.com/jwagner/simplex-noise.js

const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

const GRAD3 = new Float64Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1,
  0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);

export function createNoise3D(): (x: number, y: number, z: number) => number {
  const p = new Uint8Array(256);
  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);

  for (let i = 0; i < 256; i++) p[i] = (Math.random() * 256) | 0;
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }

  return (xin: number, yin: number, zin: number): number => {
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const z0 = zin - (k - t);

    let i1: number, j1: number, k1: number;
    let i2: number, j2: number, k2: number;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
      } else if (x0 < z0) {
        i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
      } else {
        i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    const contrib = (tx: number, ty: number, tz: number, gi: number) => {
      let tv = 0.6 - tx * tx - ty * ty - tz * tz;
      if (tv < 0) return 0;
      tv *= tv;
      return tv * tv * (GRAD3[gi] * tx + GRAD3[gi + 1] * ty + GRAD3[gi + 2] * tz);
    };

    const n0 = contrib(x0, y0, z0, permMod12[ii + perm[jj + perm[kk]]] * 3);
    const n1 = contrib(x1, y1, z1, permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3);
    const n2 = contrib(x2, y2, z2, permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3);
    const n3 = contrib(x3, y3, z3, permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3);

    return 32.0 * (n0 + n1 + n2 + n3);
  };
}
