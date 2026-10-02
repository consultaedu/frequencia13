export function random(seed: number): [number, number] {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return [next / 4294967296, next];
}
export function newSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
