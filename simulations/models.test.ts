import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lessons } from "./lessons";
import { sortingLesson } from "./algorithms";
import { assertFrames, defaults, modPow } from "./model";
import { physicsModels, predatorPrey } from "./physics";
import {
  parseSpecification,
  validateRegistration,
  extractSimulationCode,
} from "./validation";

test("every formerly generic cached concept has a real model", () => {
  const source = readFileSync(
    new URL("../constants.ts", import.meta.url),
    "utf8",
  );
  const ids = [...source.matchAll(/csConcept\('(cs_[^']+)'/g)].map((m) => m[1]);
  assert.ok(ids.length >= 49);
  for (const id of ids) assert.ok(lessons[id], `Missing ${id}`);
});
for (const [id, lesson] of Object.entries(lessons)) {
  test(`${id}: deterministic, finite default and parameter-boundary traces`, () => {
    const params = defaults(lesson);
    assert.deepEqual(lesson.run(params), lesson.run(params));
    assertFrames(lesson.run(params));
    for (const p of lesson.parameters) {
      const values =
        p.options ??
        (typeof p.value === "number" ? [p.min!, p.max!] : ["", "0", "π"]);
      for (const value of values)
        assertFrames(lesson.run({ ...params, [p.key]: value }));
    }
  });
}
for (const algorithm of ["insertion", "merge", "quick", "bubble"] as const) {
  test(`${algorithm}: all frames preserve the multiset and final arrays are sorted`, () => {
    const lesson = sortingLesson(algorithm);
    for (const order of ["Shuffled", "Sorted", "Reversed", "Duplicates"])
      for (const seed of [1, 7, 31]) {
        const frames = lesson.run({ ...defaults(lesson), order, seed });
        const sorted = [...frames[0].values!].sort((a, b) => a - b);
        for (const f of frames)
          assert.deepEqual(
            [...f.values!].sort((a, b) => a - b),
            sorted,
          );
        assert.deepEqual(frames.at(-1)!.values, sorted);
      }
  });
}
test("insertion sort measures work and recognizes already sorted input", () => {
  const lesson = lessons.cs_insertion_sort;
  const final = lesson
    .run({ ...defaults(lesson), n: 8, order: "Sorted" })
    .at(-1)!;
  assert.equal(final.metrics!.Comparisons, 7);
  assert.equal(final.metrics!["Array writes"], 0);
  const reverse = lesson
    .run({ ...defaults(lesson), n: 8, order: "Reversed" })
    .at(-1)!;
  assert.ok(Number(reverse.metrics!["Array writes"]) > 0);
});
test("race model exposes a lost update and mutex preserves both writes", () => {
  const lesson = lessons.cs_race_conditions;
  assert.equal(
    lesson.run({ initial: 7, lock: "Off" }).at(-1)!.metrics!.Actual,
    8,
  );
  assert.equal(
    lesson.run({ initial: 7, lock: "On" }).at(-1)!.metrics!.Actual,
    9,
  );
});
test("dynamic programming computes F(20) with 19 additions", () => {
  const final = lessons.cs_dynamic_programming.run({ n: 20 }).at(-1)!;
  assert.deepEqual(final.rows.at(-1), [20, 6765]);
  assert.equal(final.metrics!.Additions, 19);
});
test("DFS visits all vertices once and unwinds its stack", () => {
  const final = lessons.cs_depth_first_search.run({ start: 0 }).at(-1)!;
  assert.equal(final.metrics!.Visited, 6);
  assert.equal(final.metrics!.Stack, "Empty");
});
test("UTF-8 byte counts include multibyte code points", () => {
  const final = lessons.cs_text_encoding.run({ text: "π🌍" }).at(-1)!;
  assert.equal(final.metrics!.Bytes, 6);
});
test("joins preserve duplicate matching rows for both algorithms", () => {
  const nested = lessons.cs_relational_joins
    .run({ method: "Nested loop" })
    .at(-1)!;
  const hashed = lessons.cs_relational_joins
    .run({ method: "Hash join" })
    .at(-1)!;
  assert.deepEqual(nested.rows, [
    [1, 0, 2],
    [2, 0, 2],
  ]);
  assert.deepEqual(hashed.rows, nested.rows);
});
test("transaction commits conserve money and failures roll back", () => {
  assert.deepEqual(
    lessons.cs_acid_transactions.run({ amount: 30, outcome: "Commit" }).at(-1)!
      .rows,
    [["Committed", 70, 130, 200]],
  );
  assert.deepEqual(
    lessons.cs_acid_transactions
      .run({ amount: 30, outcome: "Fail after debit" })
      .at(-1)!.rows,
    [["Committed", 100, 100, 200]],
  );
});
test("gradient descent converges at a stable rate and exposes an unstable rate", () => {
  const stable = lessons.cs_gradient_descent.run({ rate: 0.2, x: -4 });
  assert.ok(Number(stable.at(-1)!.metrics!.Loss) < 0.001);
  for (let i = 1; i < stable.length; i++)
    assert.ok(
      Number(stable[i].metrics!.Loss) <= Number(stable[i - 1].metrics!.Loss),
    );
  const unstable = lessons.cs_gradient_descent.run({ rate: 1.2, x: -4 });
  assert.ok(
    Number(unstable.at(-1)!.metrics!.Loss) > Number(unstable[0].metrics!.Loss),
  );
});
test("toy modular exchange agrees and tampering fails signature comparison", () => {
  assert.equal(modPow(5, 6, 23), 8);
  assert.equal(
    modPow(modPow(5, 6, 23), 15, 23),
    modPow(modPow(5, 15, 23), 6, 23),
  );
  assert.equal(
    lessons.cs_hashing_signatures
      .run({ message: 42, tamper: "Original" })
      .at(-1)!.metrics!.Verification,
    "Matches",
  );
  assert.equal(
    lessons.cs_hashing_signatures
      .run({ message: 42, tamper: "Changed (+1)" })
      .at(-1)!.metrics!.Verification,
    "Mismatch",
  );
});
for (const [id, model] of Object.entries(physicsModels)) {
  test(`${id}: finite physical state throughout parameter extrema`, () => {
    const params = Object.fromEntries(
      model.parameters.map((p) => [p.key, p.value]),
    );
    for (const p of model.parameters)
      for (const value of [p.min!, p.max!]) {
        const frames = model.run({ ...params, [p.key]: value });
        assert.equal(frames[0].t, 0);
        for (const f of frames)
          assert.ok(Object.values(f).every(Number.isFinite));
        if (id !== "newton")
          for (const f of frames)
            assert.ok(Math.abs(f.energy - frames[0].energy) < 1e-8);
      }
  });
}
test("projectile range and landing match analytic known result", () => {
  const frames = physicsModels.projectile.run({ v: 10, angle: 45, g: 10 }),
    final = frames.at(-1)!;
  assert.ok(Math.abs(final.x - 10) < 1e-10);
  assert.ok(Math.abs(final.y) < 1e-10);
  assert.ok(Math.abs(final.t - Math.sqrt(2)) < 1e-10);
});
test("Newton model advances model seconds correctly without boundary wrapping", () => {
  const final = physicsModels.newton.run({ force: 10, mass: 5 }).at(-1)!;
  assert.equal(final.t, 8);
  assert.equal(final.x, 64);
  assert.equal(final.speed, 16);
  assert.equal(final.energy, 640);
});
test("eccentric orbit moves faster at periapsis and completes one period", () => {
  const frames = physicsModels.orbit.run({ eccentricity: 0.5 });
  assert.ok(frames[0].speed > frames[60].speed);
  assert.ok(Math.abs(frames[0].x - frames.at(-1)!.x) < 1e-10);
  assert.ok(Math.abs(frames[0].y - frames.at(-1)!.y) < 1e-10);
});
test("predator-prey stays positive and nearly preserves its analytic invariant", () => {
  for (const [a, b, g, d] of [
    [0.1, 0.02, 0.3, 0.01],
    [0.5, 0.1, 0.5, 0.1],
    [0.01, 0.001, 0.01, 0.001],
    [0.5, 0.001, 0.01, 0.1],
  ]) {
    const frames = predatorPrey(a, b, g, d),
      H = (x: number, y: number) =>
        d * x - g * Math.log(x) + b * y - a * Math.log(y),
      initial = H(40, 9);
    for (const f of frames) {
      assert.ok(f.prey > 0 && f.pred > 0);
      assert.ok(Number.isFinite(f.prey + f.pred));
      assert.ok(Math.abs(H(f.prey, f.pred) - initial) < 0.001);
    }
  }
});
const validSpec = {
  title: "Addition",
  question: "How does x change y?",
  assumptions: ["Integer arithmetic"],
  inputs: [
    { name: "x", meaning: "Input", min: 0, max: 10, initial: 2, unit: "count" },
  ],
  rules: ["y=x+1"],
  outputs: ["y"],
  checks: [
    { name: "Normal", input: "x=2", expected: "3" },
    { name: "Boundary", input: "x=0", expected: "1" },
  ],
};
test("specification validation rejects missing checks and invalid parameter bounds", () => {
  assert.equal(parseSpecification(JSON.stringify(validSpec)).title, "Addition");
  assert.throws(() =>
    parseSpecification(JSON.stringify({ ...validSpec, checks: [] })),
  );
  assert.throws(() =>
    parseSpecification(
      JSON.stringify({
        ...validSpec,
        inputs: [{ ...validSpec.inputs[0], initial: 20 }],
      }),
    ),
  );
});
test("executable validation rejects failed, throwing, asynchronous, and duplicate checks", () => {
  const valid = {
    title: "Model",
    assumptions: ["Bounded"],
    checks: [
      { name: "Normal", test: () => true },
      { name: "Boundary", test: () => true },
    ],
  };
  assert.deepEqual(validateRegistration(valid), ["Normal", "Boundary"]);
  for (const testFn of [
    () => false,
    () => {
      throw new Error("Bad state");
    },
    () => Promise.resolve(true),
  ]) {
    assert.throws(
      () =>
        validateRegistration({
          ...valid,
          checks: [
            valid.checks[0],
            { name: "Boundary", test: testFn as () => boolean },
          ],
        }),
      /Model check failed: Boundary/,
    );
  }
  assert.throws(
    () =>
      validateRegistration({
        ...valid,
        checks: [valid.checks[0], valid.checks[0]],
      }),
    /unique/,
  );
});
test("generated and repaired code is marked for mandatory registration", () => {
  assert.equal(
    extractSimulationCode("```jsx\nrender(<Demo/>);\n```"),
    "// @simulation-model-v1\nrender(<Demo/>);",
  );
  assert.throws(() => extractSimulationCode(""));
});

test("model specifications also support freeform text and named choices", () => {
  const textInput = {
    name: "source",
    meaning: "Expression to inspect",
    initial: "2 + 3 * 4",
    unit: "",
    min: null,
    max: null,
    options: [],
  };
  assert.equal(
    parseSpecification(JSON.stringify({ ...validSpec, inputs: [textInput] }))
      .inputs[0].initial,
    "2 + 3 * 4",
  );
  assert.throws(() =>
    parseSpecification(
      JSON.stringify({
        ...validSpec,
        inputs: [{ ...textInput, options: ["a", "b"] }],
      }),
    ),
  );
});
