export type Params = Record<string, number | string>;
export interface Parameter {
  key: string;
  label: string;
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}
export interface Frame {
  explanation: string;
  rows: (string | number)[][];
  metrics?: Record<string, string | number>;
  values?: number[];
  active?: number[];
}
export interface Lesson {
  assumptions: string;
  columns: string[];
  parameters: Parameter[];
  run: (params: Params) => Frame[];
}
export const num = (
  key: string,
  label: string,
  value: number,
  min = 1,
  max = 12,
  step = 1,
): Parameter => ({ key, label, value, min, max, step });
export const choice = (
  key: string,
  label: string,
  options: string[],
): Parameter => ({ key, label, value: options[0], options });
export const input = (
  key: string,
  label: string,
  value: string,
): Parameter => ({ key, label, value });
export const defaults = (lesson: Lesson): Params =>
  Object.fromEntries(lesson.parameters.map((p) => [p.key, p.value]));
export const frame = (
  explanation: string,
  rows: Frame["rows"],
  metrics?: Frame["metrics"],
): Frame => ({ explanation, rows, metrics });
export const round = (n: number) => Number(n.toFixed(4));
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function modPow(base: number, exponent: number, modulus: number) {
  let result = 1;
  for (let i = 0; i < exponent; i++) result = (result * base) % modulus;
  return result;
}
export function assertFrames(frames: Frame[]) {
  if (!frames.length || frames.length > 5000)
    throw new Error("Model must return 1–5000 steps.");
  for (const f of frames) {
    if (!f.explanation)
      throw new Error("Every model step needs an explanation.");
    for (const value of [
      ...f.rows.flat(),
      ...Object.values(f.metrics ?? {}),
      ...(f.values ?? []),
    ]) {
      if (typeof value === "number" && !Number.isFinite(value))
        throw new Error("Model produced a non-finite value.");
    }
  }
  return frames;
}
