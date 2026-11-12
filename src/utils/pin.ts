// O PIN do perfil nunca se guarda em texto simples: guarda-se um verificador "v1$sal$hash".
// (Protege o PIN de quem apenas veja o armazenamento da app; o PIN continua a ser curto, por isso não substitui
// o bloqueio do próprio telemóvel — a opção "Bloqueio do dispositivo" é a mais forte.)

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** SHA-256 de bytes, devolvido em bytes. */
export function sha256(dados: number[]): number[] {
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const bytes = dados.slice();
  const bits = dados.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const alto = Math.floor(bits / 0x100000000);
  const baixo = bits >>> 0;
  for (const v of [alto, baixo]) bytes.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);

  const w = new Array<number>(64);
  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = ((bytes[i + 4 * t] << 24) | (bytes[i + 4 * t + 1] << 16) | (bytes[i + 4 * t + 2] << 8) | bytes[i + 4 * t + 3]) | 0;
    }
    for (let t = 16; t < 64; t++) {
      const s0 = ((w[t - 15] >>> 7) | (w[t - 15] << 25)) ^ ((w[t - 15] >>> 18) | (w[t - 15] << 14)) ^ (w[t - 15] >>> 3);
      const s1 = ((w[t - 2] >>> 17) | (w[t - 2] << 15)) ^ ((w[t - 2] >>> 19) | (w[t - 2] << 13)) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[t] + w[t]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  const out: number[] = [];
  for (const v of h) out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
  return out;
}

const paraBytes = (s: string): number[] => Array.from(unescape(encodeURIComponent(s)), c => c.charCodeAt(0));
const paraHex = (b: number[]): string => b.map(x => x.toString(16).padStart(2, '0')).join('');
const RONDAS = 5000;

function derivar(pin: string, sal: string): string {
  let h = sha256(paraBytes(sal + ':' + pin));
  for (let i = 1; i < RONDAS; i++) h = sha256(h.concat(paraBytes(sal)));
  return paraHex(h);
}

function salAleatorio(): string {
  let s = '';
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return s;
}

/** Cria o verificador a guardar no lugar do PIN. */
export function criarVerificadorPin(pin: string): string {
  const sal = salAleatorio();
  return `v1$${sal}$${derivar(pin, sal)}`;
}

/** Já está no formato novo? (versões antigas guardavam o PIN em texto simples.) */
export function ehVerificadorPin(guardado: string): boolean {
  return guardado.startsWith('v1$');
}

/** Confere um PIN com o que está guardado (aceita ainda o formato antigo, para migrar sem bloquear ninguém). */
export function pinCorresponde(pin: string, guardado: string): boolean {
  if (!guardado) return false;
  if (!ehVerificadorPin(guardado)) return pin === guardado;
  const [, sal, hash] = guardado.split('$');
  return !!sal && !!hash && derivar(pin, sal) === hash;
}
