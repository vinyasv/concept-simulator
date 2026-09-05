import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateRegistration, SimulationRegistration } from "./validation";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Recharts from "recharts";
import * as LucideReact from "lucide-react";
import { LIBRARY_DATA } from "../constants";
import { SimFrame, Control, Stat } from "../components/SimSDK";
import { TraceSimulation } from "../components/TraceSimulation";
import { PhysicsSimulation } from "../components/PhysicsSimulation";
import { predatorPrey } from "./physics";
import {
  PlaybackControls,
  ModelNotes,
  useSimulationTimeline,
} from "./playback";
import { useSimulationSnapshot } from "./observation";
import { seededRandom } from "./model";

const cases = LIBRARY_DATA.flatMap((c) =>
  c.subcategories.flatMap((s) => s.items),
).map((item) => ({ label: item.label, cachedCode: item.cachedCode }));
if (process.env.SIMULATION_SAMPLE)
  cases.push({
    label: "Fresh generated sample",
    cachedCode: readFileSync(process.env.SIMULATION_SAMPLE, "utf8"),
  });
for (const item of cases) {
  if (!item.cachedCode) continue;
  test(`library render: ${item.label}`, () => {
    let element: React.ReactNode = null;
    let registered = false;
    const scope = {
      React,
      ...React,
      Recharts,
      LucideReact,
      SimFrame,
      Control,
      Stat,
      TraceSimulation,
      PhysicsSimulation,
      predatorPrey,
      PlaybackControls,
      ModelNotes,
      useSimulationTimeline,
      useSimulationSnapshot,
      seededRandom,
      registerSimulation: (model: SimulationRegistration) => {
        validateRegistration(model);
        registered = true;
      },
      render: (node: React.ReactNode) => {
        element = node;
      },
      require: (name: string) => {
        if (name === "react") return React;
        if (name === "recharts") return Recharts;
        if (name === "lucide-react") return LucideReact;
        throw new Error(`Unsupported module ${name}`);
      },
    };
    const result = ts.transpileModule(item.cachedCode!, {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: "simulation.tsx",
      reportDiagnostics: true,
    });
    assert.equal(
      result.diagnostics?.length ?? 0,
      0,
      result.diagnostics
        ?.map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "))
        .join("\n"),
    );
    new Function(...Object.keys(scope), result.outputText)(
      ...Object.values(scope),
    );
    if (item.cachedCode.startsWith("// @simulation-model-v1"))
      assert.ok(registered, "Generated code must register executable checks");
    assert.ok(element);
    const html = renderToStaticMarkup(element);
    assert.ok(html.length > 100);
    assert.ok(!html.includes("NaN"), "Non-finite output in initial render");
  });
}
