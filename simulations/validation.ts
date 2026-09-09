export interface SimulationSpecification {
  title: string;
  question: string;
  assumptions: string[];
  exploration: {
    objects: string[];
    firstAction: string;
    actions: { verb: string; target: string; consequence: string }[];
    feedback: string;
    invitation: string;
    reset: string;
  };
  inputs: {
    name: string;
    meaning: string;
    min?: number | null;
    max?: number | null;
    initial: number | string;
    options?: string[];
    unit: string;
  }[];
  rules: string[];
  outputs: string[];
  checks: { name: string; input: string; expected: string }[];
}
export interface SimulationRegistration {
  title: string;
  assumptions: string[];
  checks: { name: string; test: () => boolean }[];
}

export type SimulationPlan =
  | { kind: "clarify"; clarification: string; specification: null }
  | {
      kind: "build";
      clarification: string;
      specification: SimulationSpecification;
    };
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((s) => typeof s === "string" && s.trim());
export function parseSpecification(text: string): SimulationSpecification {
  const spec = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  if (
    !spec ||
    typeof spec.title !== "string" ||
    !spec.title.trim() ||
    typeof spec.question !== "string" ||
    !spec.question.trim() ||
    !strings(spec.assumptions) ||
    !strings(spec.rules) ||
    !strings(spec.outputs) ||
    !Array.isArray(spec.inputs) ||
    !Array.isArray(spec.checks) ||
    spec.checks.length < 2
  ) {
    throw new Error(
      "Model specification is incomplete. Please try generating again.",
    );
  }
  const exploration = spec.exploration;
  if (
    !exploration ||
    !strings(exploration.objects) ||
    ![
      exploration.firstAction,
      exploration.feedback,
      exploration.invitation,
      exploration.reset,
    ].every((value) => typeof value === "string" && value.trim()) ||
    !Array.isArray(exploration.actions) ||
    !exploration.actions.length ||
    !exploration.actions.every(
      (action: { verb?: string; target?: string; consequence?: string }) =>
        action &&
        [action.verb, action.target, action.consequence].every(
          (value) => typeof value === "string" && value.trim(),
        ),
    )
  ) {
    throw new Error(
      "Specify visible objects, learner actions, immediate feedback, an invitation, and reset behavior.",
    );
  }
  for (const parameter of spec.inputs) {
    if (
      !parameter ||
      typeof parameter.name !== "string" ||
      !parameter.name.trim() ||
      typeof parameter.meaning !== "string" ||
      typeof parameter.unit !== "string" ||
      (typeof parameter.initial === "number"
        ? ![parameter.min, parameter.max, parameter.initial].every(
            Number.isFinite,
          ) ||
          parameter.min > parameter.max ||
          parameter.initial < parameter.min ||
          parameter.initial > parameter.max
        : typeof parameter.initial !== "string") ||
      (parameter.options !== undefined &&
        (!Array.isArray(parameter.options) ||
          !parameter.options.every(
            (value: unknown) => typeof value === "string",
          ) ||
          (parameter.options.length > 0 &&
            !parameter.options.includes(parameter.initial))))
    ) {
      throw new Error("Model specification contains an invalid input range.");
    }
  }
  for (const check of spec.checks) {
    if (
      !check ||
      ![check.name, check.input, check.expected].every(
        (s) => typeof s === "string" && s.trim(),
      )
    )
      throw new Error("Model specification needs concrete expected results.");
  }
  return spec;
}

export function parseSimulationPlan(text: string): SimulationPlan {
  const plan = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  if (plan?.kind === "clarify") {
    if (typeof plan.clarification !== "string" || !plan.clarification.trim()) {
      throw new Error("A clarification plan needs one concrete question.");
    }
    return {
      kind: "clarify",
      clarification: plan.clarification.trim(),
      specification: null,
    };
  }
  if (plan?.kind !== "build" || !plan.specification) {
    throw new Error("The simulation plan is incomplete.");
  }
  return {
    kind: "build",
    clarification:
      typeof plan.clarification === "string" ? plan.clarification : "",
    specification: parseSpecification(JSON.stringify(plan.specification)),
  };
}

export function suggestionsFromSpecification(
  specification: SimulationSpecification,
): string[] {
  const candidates = [
    specification.exploration.invitation,
    specification.exploration.firstAction,
    ...specification.exploration.actions.map(
      (action) => `${action.verb} ${action.target}. What changes?`,
    ),
  ];
  return [...new Set(candidates.map((value) => value.trim()).filter(Boolean))].slice(
    0,
    3,
  );
}
/** Checks are executable regression examples, not a guarantee of scientific correctness. */
export function validateRegistration(
  registration: SimulationRegistration,
): string[] {
  if (
    !registration ||
    typeof registration.title !== "string" ||
    !registration.title.trim() ||
    !strings(registration.assumptions) ||
    !Array.isArray(registration.checks) ||
    registration.checks.length < 2 ||
    registration.checks.length > 20
  ) {
    throw new Error(
      "Register a model title, assumptions, and 2–20 executable checks.",
    );
  }
  const names = new Set<string>();
  for (const check of registration.checks) {
    if (
      !check ||
      typeof check.name !== "string" ||
      !check.name.trim() ||
      names.has(check.name) ||
      typeof check.test !== "function"
    )
      throw new Error("Model checks need unique names and test functions.");
    names.add(check.name);
    try {
      if (check.test() !== true) throw new Error("Expected true");
    } catch (error) {
      throw new Error(
        `Model check failed: ${check.name}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return [...names];
}
export function extractSimulationCode(text: string): string {
  const match = text.match(/```(?:tsx|jsx|javascript|js)?\s*([\s\S]*?)\s*```/);
  const code = (match ? match[1] : text)
    .trim()
    .replace(/^```(?:tsx|jsx|javascript|js)?[ \t]*\r?\n/, "")
    .replace(/(?:\r?\n)?```[ \t]*$/, "")
    .replace(/^(?:\/\/ @simulation-model-v1\s*\r?\n)+/, "")
    .trim();
  if (!code) throw new Error("The model returned no simulation code.");
  return `// @simulation-model-v1\n${code}`;
}

/** Provider-side shape constraints prevent free-form JSON from failing only after a long request. */
export const SPECIFICATION_SCHEMA = {
  type: "object",
  required: [
    "title",
    "question",
    "assumptions",
    "exploration",
    "inputs",
    "rules",
    "outputs",
    "checks",
  ],
  properties: {
    title: { type: "string" },
    question: { type: "string" },
    exploration: {
      type: "object",
      required: [
        "objects",
        "firstAction",
        "actions",
        "feedback",
        "invitation",
        "reset",
      ],
      properties: {
        objects: { type: "array", minItems: 1, items: { type: "string" } },
        firstAction: { type: "string" },
        actions: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["verb", "target", "consequence"],
            properties: {
              verb: { type: "string" },
              target: { type: "string" },
              consequence: { type: "string" },
            },
          },
        },
        feedback: { type: "string" },
        invitation: { type: "string" },
        reset: { type: "string" },
      },
    },
    assumptions: { type: "array", minItems: 1, items: { type: "string" } },
    rules: { type: "array", minItems: 1, items: { type: "string" } },
    outputs: { type: "array", minItems: 1, items: { type: "string" } },
    inputs: {
      type: "array",
      items: {
        type: "object",
        required: [
          "name",
          "meaning",
          "initial",
          "unit",
          "min",
          "max",
          "options",
        ],
        properties: {
          name: { type: "string" },
          meaning: { type: "string" },
          unit: { type: "string" },
          initial: { anyOf: [{ type: "number" }, { type: "string" }] },
          min: { anyOf: [{ type: "number" }, { type: "null" }] },
          max: { anyOf: [{ type: "number" }, { type: "null" }] },
          options: { type: "array", items: { type: "string" } },
        },
      },
    },
    checks: {
      type: "array",
      minItems: 2,
      maxItems: 20,
      items: {
        type: "object",
        required: ["name", "input", "expected"],
        properties: {
          name: { type: "string" },
          input: { type: "string" },
          expected: { type: "string" },
        },
      },
    },
  },
};

export const SIMULATION_PLAN_SCHEMA = {
  type: "object",
  required: ["kind", "clarification", "specification"],
  properties: {
    kind: { type: "string", enum: ["clarify", "build"] },
    clarification: { type: "string" },
    specification: {
      anyOf: [SPECIFICATION_SCHEMA, { type: "null" }],
    },
  },
};
