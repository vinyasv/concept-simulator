import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fixSimulationCode } from "../services/geminiService";
const origin = process.env.SIMULATION_ORIGIN || "http://127.0.0.1:3000";
const request = globalThis.fetch;
globalThis.fetch = (input, init) =>
  request(
    typeof input === "string" && input.startsWith("/") ? origin + input : input,
    init,
  );
const findings = {
  circuit:
    "Browser audit: at a 600x420 SimFrame, the whole circuit is tiny, with an unnecessary dark analyzer duplicating the stats. Redesign the component scene to fill ~550x250 with large battery, two bulbs and directly clickable switches. Keep topology selection on canvas, use native HTML buttons where helpful, no side analyzer and no tiny SVG explanations. Start with a short invitation that doesn't give away the answer. CRITICAL actual observed bug: open Switch 1 in Series, then select Parallel. Bulb 1 is 0W and Bulb 2 is 24W, but feedback says each receives full voltage and quadruples to 0W. Derive feedback from complete resulting state and add an assertion for this mixed action sequence. Retain the existing physics model and all existing expected checks. Preserve 12V, two 6ohm bulbs; per branch current/power must stay correct. Include reset and keyboard operable switches. No new imports/dependencies.",
  sorting:
    "Browser audit: at a 600x420 SimFrame, the SVG tray and action labels are tiny. Redesign using a compact ~550x250 scene with large tiles, slots and visible native HTML actions or accessible SVG targets >=32 actual pixels. Remove the SVG header/invitation duplication, jargon such as ACTIVE HAND CRADLE or ASCENDING INVARIANT, and step-by-step answer instructions. Keep one brief invitation above the scene. Let users pick the next tile, move/compare existing tiles and attempt a placement with local feedback. Preserve your actual model, undo/reset, all original checks and expected outcomes. Ensure initial pick and all later slots/actions are comfortably readable at the small canvas. No decorative panels. No new imports/dependencies.",
};
await mkdir("artifacts/generations/initial", { recursive: true });
await Promise.allSettled(
  Object.entries(findings).map(async ([id, finding]) => {
    const path = `artifacts/generations/${id}.jsx`;
    const original = await readFile(path, "utf8");
    await writeFile(`artifacts/generations/initial/${id}.jsx`, original);
    console.log(`Repairing ${id} from browser findings`);
    try {
      const fixed = await fixSimulationCode(original, finding, (message) =>
        console.log(`${id}: ${message}`),
      );
      await writeFile(path, fixed);
      const metadata = JSON.parse(
        await readFile(`artifacts/generations/${id}.json`, "utf8"),
      );
      await writeFile(
        `artifacts/generations/${id}.json`,
        JSON.stringify(
          {
            ...metadata,
            repairFinding: finding,
            status: "Repaired; browser retest pending",
          },
          null,
          2,
        ),
      );
      console.log(`${id}: repaired ${fixed.length} characters`);
    } catch (error) {
      console.error(
        `${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exitCode = 1;
    }
  }),
);
