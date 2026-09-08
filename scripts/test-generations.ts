/** Runs the real two-stage generation service through the local API; never reads or prints keys. */
import { writeFile, mkdir } from "node:fs/promises";
import { analyzeAndGenerateSimulation } from "../services/geminiService";
const origin = process.env.SIMULATION_ORIGIN || "http://127.0.0.1:3000";
const request = globalThis.fetch;
globalThis.fetch = (input, init) =>
  request(
    typeof input === "string" && input.startsWith("/") ? origin + input : input,
    init,
  );
const prompts = [
  {
    id: "circuit",
    text: "Help me discover series and parallel circuits by playing with a battery, bulbs, and wires. I want to connect things, open a switch, and see which bulbs respond. Keep it a small honest ideal resistive DC model.",
  },
  {
    id: "sorting",
    text: "Help me discover insertion sort by moving numbered objects into a sorted tray myself. Let me try choices and see why a placement works or does not, and compare arrangements. I want to play, not watch an automatic animation.",
  },
];
await mkdir("artifacts/generations", { recursive: true });
for (const sample of prompts) {
  const started = Date.now();
  console.log(`Generating ${sample.id}…`);
  try {
    const code = await analyzeAndGenerateSimulation(
      Buffer.from(sample.text).toString("base64"),
      "text/plain",
      (message) => console.log(`${sample.id}: ${message}`),
    );
    await writeFile(`artifacts/generations/${sample.id}.jsx`, code);
    await writeFile(
      `artifacts/generations/${sample.id}.json`,
      JSON.stringify(
        {
          prompt: sample.text,
          generatedAt: new Date().toISOString(),
          elapsedSeconds: Math.round((Date.now() - started) / 1000),
          status: "generated; browser verification pending",
        },
        null,
        2,
      ),
    );
    console.log(`${sample.id}: saved ${code.length} characters`);
  } catch (error) {
    console.error(
      `${sample.id}: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
