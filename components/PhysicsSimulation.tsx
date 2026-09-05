import React from "react";
import { useSimulationSnapshot } from "../simulations/observation";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SimFrame, Control, Stat } from "./SimSDK";
import { physicsModels } from "../simulations/physics";
import { Params } from "../simulations/model";
import {
  ModelNotes,
  PlaybackControls,
  useSimulationTimeline,
} from "../simulations/playback";
export function PhysicsSimulation({ id }: { id: string }) {
  return <PhysicsLesson key={id} id={id} />;
}
function PhysicsLesson({ id }: { id: string }) {
  const model = physicsModels[id];
  const [view, setView] = React.useState("motion");
  const [params, setParams] = React.useState<Params>(() =>
    Object.fromEntries(model.parameters.map((p) => [p.key, p.value])),
  );
  const frames = React.useMemo(() => model.run(params), [model, params]);
  const timeline = useSimulationTimeline(frames),
    state = timeline.frame;
  useSimulationSnapshot({
    title: model.title,
    assumptions: model.assumptions,
    parameters: params,
    step: timeline.index,
    state,
  });
  const orbit = id === "orbit";
  const minX = Math.min(0, ...frames.map((f) => f.x)),
    maxX = Math.max(0, ...frames.map((f) => f.x)),
    minY = Math.min(0, ...frames.map((f) => f.y)),
    maxY = Math.max(0, ...frames.map((f) => f.y));
  // Uniform scaling preserves physical angles and orbital shape, with bounds fixed for the entire run.
  const scale = Math.min(
    510 / Math.max(1, maxX - minX),
    175 / Math.max(1, maxY - minY),
  );
  const x = (v: number) => 300 + (v - (minX + maxX) / 2) * scale,
    y = (v: number) => 120 - (v - (minY + maxY) / 2) * scale;
  return (
    <SimFrame
      title={model.title}
      description={model.description}
      controls={
        <>
          {model.parameters.map((p) => (
            <Control key={p.key} label={p.label} value={params[p.key]}>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={params[p.key]}
                onChange={(e) =>
                  setParams((v) => ({ ...v, [p.key]: Number(e.target.value) }))
                }
              />
            </Control>
          ))}
        </>
      }
      stats={
        <>
          <Stat
            label="Model time"
            value={state.t.toFixed(2)}
            unit={orbit ? "normalized" : "s"}
          />
          <Stat
            label="Speed"
            value={state.speed.toFixed(2)}
            unit={orbit ? "normalized" : "m/s"}
            highlight
          />
          <Stat
            label="Energy"
            value={state.energy.toFixed(2)}
            unit={orbit ? "specific" : "J"}
          />
        </>
      }
    >
      <div className="sim-lesson sim-canvas-layout">
        <div className="sim-view-tabs">
          <button
            type="button"
            aria-pressed={view === "motion"}
            onClick={() => setView("motion")}
          >
            Experiment
          </button>
          <button
            type="button"
            aria-pressed={view === "graph"}
            onClick={() => setView("graph")}
          >
            Position / time
          </button>
        </div>
        <PlaybackControls timeline={timeline} />
        <div className="sim-lesson-body">
          <p className="sim-explanation">
            {orbit
              ? `Distance from the focus: ${Math.hypot(state.x, state.y).toFixed(2)}. The orbital energy stays at −0.50.`
              : id === "projectile"
                ? `At ${state.t.toFixed(2)} s, height is ${state.y.toFixed(2)} m and horizontal distance is ${state.x.toFixed(2)} m.`
                : id === "newton"
                  ? `Acceleration = force / mass = ${(Number(params.force) / Number(params.mass)).toFixed(2)} m/s². Displacement is ${state.x.toFixed(2)} m.`
                  : `Displacement is ${state.x.toFixed(2)} m. At equilibrium the speed is largest; at the turning points it is zero.`}
          </p>
          {view === "motion" ? (
            <svg
              viewBox="0 0 600 245"
              className="sim-physics-scene"
              role="img"
              aria-label={`${model.title}: x ${state.x.toFixed(2)}, y ${state.y.toFixed(2)}`}
            >
              <line x1="35" x2="570" y1={y(0)} y2={y(0)} stroke="#ddd" />
              <line x1={x(0)} x2={x(0)} y1="20" y2="220" stroke="#eee" />
              <polyline
                points={frames.map((f) => `${x(f.x)},${y(f.y)}`).join(" ")}
                fill="none"
                stroke="#ccc"
                strokeDasharray="3 3"
              />
              <polyline
                points={frames
                  .slice(0, timeline.index + 1)
                  .map((f) => `${x(f.x)},${y(f.y)}`)
                  .join(" ")}
                fill="none"
                stroke="#111"
                strokeWidth="1.5"
              />
              {orbit && (
                <>
                  <circle cx={x(0)} cy={y(0)} r="5" fill="#666" />
                  <line
                    x1={x(0)}
                    y1={y(0)}
                    x2={x(state.x)}
                    y2={y(state.y)}
                    stroke="#bbb"
                  />
                </>
              )}
              <circle cx={x(state.x)} cy={y(state.y)} r="6" fill="#111" />
              <text x="35" y="237" fontSize="11" fill="#777">
                {orbit
                  ? "Coordinates in normalized units"
                  : "Coordinates in meters"}{" "}
                · dashed: complete path · solid: traveled path
              </text>
            </svg>
          ) : (
            <div className="sim-chart-view">
              <ResponsiveContainer>
                <LineChart
                  data={frames.slice(0, timeline.index + 1)}
                  margin={{ left: 10, right: 20, bottom: 20 }}
                >
                  <CartesianGrid stroke="#eee" />
                  <XAxis
                    type="number"
                    dataKey="t"
                    domain={[0, frames[frames.length - 1].t]}
                    tickFormatter={(v) => Number(v).toFixed(1)}
                    label={{
                      value: orbit ? "Time (normalized)" : "Time (s)",
                      position: "bottom",
                    }}
                  />
                  <YAxis
                    domain={[minX - 0.1, maxX + 0.1]}
                    tickFormatter={(v) => Number(v).toFixed(1)}
                  />
                  <Tooltip />
                  <Line
                    type="linear"
                    dataKey="x"
                    name={orbit ? "x (normalized)" : "x (m)"}
                    stroke="#111"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <ModelNotes>{model.assumptions}</ModelNotes>
      </div>
    </SimFrame>
  );
}
