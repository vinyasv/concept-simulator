# Simulation authoring

The product keeps a small shared UI and lets models author ordinary React, SVG,
Canvas, or Recharts. There is no required domain language or fixed visual template.
`SimFrame`, `Control`, and `Stat` preserve the existing visual language.

## Learning through play

The primary experience is a prepared environment: a few concrete objects, an
inviting starting state, meaningful actions on those objects, and immediate visible
consequences. The learner should be able to discover the relationship by trying two
different action sequences. Explanations follow the learner's action rather than
leading with the answer.

Each simulation needs a concept-specific verb such as flip, connect, move, schedule,
send, or place. Sliders, playback, tabs, and tables may support an experiment, but
they are not sufficient as its primary interaction. Keep primary actions beside the
objects they affect. Include Undo or Reset and explain blocked actions locally.
Avoid scores, confetti, mandatory quizzes, and decorative game mechanics.

## Generated simulations

`services/geminiService.ts` first requests a structured model specification:
learning question, assumptions, input ranges or choices, rules, outputs, and known
examples. Provider-side JSON schema validation constrains its shape; local checks
verify ranges and required fields. One correction request is allowed for an invalid
specification. A second request implements the model and its checks.

`simulations/generationInstructions.ts` documents the small runtime API. Models can
use direct manipulation, static parameterized relationships, or time evolution.
`useSimulationTimeline` and `PlaybackControls` are optional conveniences for bounded
traces. Keep frame arrays memoized. Numeric model time is independent of playback.
`seededRandom` provides reproducible experiments; `useSimulationSnapshot` publishes
bounded model state to the assistant only when a user asks a question.

Generated code registers a title, assumptions, and 2–20 named synchronous checks.
`SimulationCanvas` runs those checks before displaying the component. Failed checks
enter the existing bounded repair path, as do compilation and rendering errors.
Checks must call the same pure functions used by the visible model. Repairs must
preserve expected results rather than weakening the checks.

These are model-authored checks. They catch inconsistent implementations and common
regressions, but are not independent scientific verification. The runtime still
executes generated code in the application as before; check execution is not a
sandbox or a hard timeout. There is no 3D renderer in this change.

## Canvas layout

Simulations occupy the available viewport. `SimFrame` owns the compact title bar,
optional About and Adjust overlays, canvas, and inline readings. Put inputs directly
in its `controls` prop and limit primary readings to three. Keep the main experiment
visible; use alternate views for graphs and paginated tables instead of stacking
sections. Model assumptions open above the canvas rather than expanding the page.

Generated layouts must use responsive dimensions and `min-height: 0` in flex/grid
children, avoid nested scrolling, and fit a 600 × 420 viewport. The model can still
choose its own visual representation and interactions. `CanvasFit` provides a
bounded best-effort scale-to-fit fallback for older or overflowing layouts; it is
not a replacement for authoring a responsive scene. Fixed-size legacy descendants
may still need regeneration or manual layout changes.

The assistant is a collapsible right-hand dock. It starts closed on small screens;
its transcript scrolls independently without moving the simulation.

## Curated library

The Computer Science library opens with 50 hands-on workbenches. Related topics
share a material where comparing behavior is the useful experiment: for example,
one data-structure tray can become a stack, queue, set, array, or linked list while
preserving its objects. The original 56 stepwise lessons remain as internal model
fixtures for regression coverage; they are not exposed in the learner-facing library.

The 50 materials span visible symbol encoding, memory and object structures, paths
and algorithms, interruptible systems, databases, security, and small AI models.
They use tile trays, grids, node maps, queues, memory frames, pipeline lanes, and
decision surfaces; charts and tables are never the primary CS activity.

Hands-on state transitions live in `simulations/playground.ts`; the UI calls those
same functions tested in `simulations/playground.test.ts`. Workbench metadata and
search terms live in `simulations/playgroundCatalog.ts`.

The former generic CS placeholders now reference `simulations/lessons.ts`. Each
lesson owns parameters, explicit assumptions, and a deterministic `run(params)`
function returning actual state transitions. `TraceSimulation` renders state,
measured counters, explanations, diagrams, and shared playback. Some lessons are
intentionally small illustrative systems (such as a single Raft election or a
one-neuron gradient calculation); their assumptions state those boundaries.

Add a lesson to the relevant model module, register it in `lessons.ts`, and add the
library entry in `constants.ts`. Do not substitute phase-based decorative values
for model behavior. Build concept-specific diagrams from the recorded state.

`simulations/physics.ts` contains analytic projectile, constant-force, harmonic,
and Keplerian models, plus a positive-population Lotka–Volterra integrator. Their
curated checks use known solutions and conserved quantities.

## Verification

- `npm test`: independent model assertions, parameter-boundary checks, generation
  contract tests, action-sequence tests, and initial-render smoke tests for every
  cached library entry.
- `npm run typecheck`: TypeScript checks.
- `npm run build`: production compilation.

`generation-lab.html` is a development-only visual harness. It opens every
workbench and saved generated sample at 600 × 420, 960 × 600, or 360 × 560 without
adding the harness to the production entry point. `scripts/test-generations.ts`
creates two real samples through the local generation API; the saved prompts and
browser findings are recorded beside the output in `artifacts/generations/`.

The library smoke test checks generated JSX syntax and server rendering; it does
not test browser layout, animation effects, or the scientific validity of every
older lesson. Recharts can report missing dimensions during server rendering
because it needs a browser to measure its container. Use browser verification for
playback, input reset behavior, responsive layouts, and a real generation request.
