import React from "react";
import { useSimulationSnapshot } from "../simulations/observation";
import { SimFrame, Control, Stat } from "./SimSDK";
import { StateDiagram } from "./StateDiagram";
import { lessons } from "../simulations/lessons";
import { Params, defaults, assertFrames } from "../simulations/model";
import {
  ModelNotes,
  PlaybackControls,
  useSimulationTimeline,
} from "../simulations/playback";

export function TraceSimulation({ id, title }: { id: string; title: string }) {
  const lesson = lessons[id];
  if (!lesson) throw new Error(`No model registered for ${id}`);
  // Keyed inner component ensures switching lessons never carries incompatible parameters.
  return <LessonSimulation key={id} id={id} title={title} />;
}
function LessonSimulation({ id, title }: { id: string; title: string }) {
  const lesson = lessons[id];
  const [view, setView] = React.useState("visual");
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(5);
  const dataRef = React.useRef<HTMLDivElement>(null);
  const [params, setParams] = React.useState<Params>(() => defaults(lesson));
  const frames = React.useMemo(
    () => assertFrames(lesson.run(params)),
    [lesson, params],
  );
  const timeline = useSimulationTimeline(frames);
  const current = timeline.frame;
  useSimulationSnapshot({
    title,
    assumptions: lesson.assumptions,
    parameters: params,
    step: timeline.index,
    state: current,
  });
  const isSorting = [
    "cs_insertion_sort",
    "cs_merge_sort",
    "cs_quicksort",
    "bubble",
  ].includes(id);
  const diagramIds = [
    "cs_depth_first_search",
    "cs_gradient_descent",
    "cs_binary_numbers",
    "cs_cpu_pipelining",
    "cs_arrays",
    "cs_stacks_queues",
    "cs_abstract_data_types",
    "cs_linked_lists",
    "cs_union_find",
    "cs_functions_call_stack",
    "cs_recursion",
    "cs_reinforcement_learning",
    "cs_packet_switching",
  ];
  const hasVisual =
    isSorting || Boolean(current.values) || diagramIds.includes(id);
  const showData = view === "data" || !hasVisual;
  React.useLayoutEffect(() => {
    const element = dataRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setPageSize(
        Math.max(1, Math.min(5, Math.floor((element.clientHeight - 95) / 36))),
      ),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [showData]);
  const pageCount = Math.max(1, Math.ceil(current.rows.length / pageSize));
  const activePage = Math.min(page, pageCount - 1);
  return (
    <SimFrame
      title={title}
      description={
        isSorting
          ? "Follow every comparison and move. Change the input, replay the same run, and inspect the measured work."
          : "Change the inputs and step through the model. Each event explains an actual calculation or state transition."
      }
      controls={
        <>
          {lesson.parameters.map((parameter) => (
            <Control
              key={parameter.key}
              label={parameter.label}
              value={params[parameter.key]}
            >
              {parameter.options ? (
                <select
                  value={params[parameter.key]}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      [parameter.key]: e.target.value,
                    }))
                  }
                >
                  {parameter.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : typeof parameter.value === "number" ? (
                <input
                  type="range"
                  min={parameter.min}
                  max={parameter.max}
                  step={parameter.step}
                  value={params[parameter.key]}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      [parameter.key]: Number(e.target.value),
                    }))
                  }
                />
              ) : (
                <input
                  type="text"
                  maxLength={120}
                  value={params[parameter.key]}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      [parameter.key]: e.target.value,
                    }))
                  }
                />
              )}
            </Control>
          ))}
        </>
      }
      stats={
        <>
          {Object.entries(current.metrics ?? {})
            .slice(0, 3)
            .map(([label, value], i) => (
              <Stat
                key={label}
                label={label}
                value={value}
                highlight={i === 0}
              />
            ))}
        </>
      }
    >
      <div className="sim-lesson sim-canvas-layout">
        <div className="sim-view-tabs" aria-label="Simulation view">
          {hasVisual && (
            <>
              <button
                type="button"
                aria-pressed={!showData}
                onClick={() => setView("visual")}
              >
                Experiment
              </button>
              <button
                type="button"
                aria-pressed={showData}
                onClick={() => setView("data")}
              >
                Data
              </button>
            </>
          )}
        </div>
        <PlaybackControls timeline={timeline} />
        <div className="sim-lesson-body">
          <p
            className="sim-explanation"
            aria-live={timeline.playing ? "off" : "polite"}
          >
            {current.explanation}
          </p>
          {!showData && (
            <div className="sim-visual-area">
              <StateDiagram id={id} state={current} params={params} />
              {current.values &&
                (isSorting ? (
                  <div
                    className="sim-bars"
                    role="img"
                    aria-label={`Array: ${current.values.join(", ")}. Active indices: ${(current.active ?? []).join(", ")}`}
                  >
                    {current.values.map((value, i) => (
                      <div className="sim-bar-column" key={i}>
                        <span>{value}</span>
                        <div
                          className={
                            current.active?.includes(i) ? "is-active" : ""
                          }
                          style={{
                            height: `${Math.max(3, (value / Math.max(...current.values, 1)) * 130)}px`,
                          }}
                        />
                        <small>{i}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <svg
                    className="sim-history"
                    viewBox="0 0 600 150"
                    role="img"
                    aria-label="Output history, left to right in step order"
                  >
                    <line x1="12" y1="138" x2="588" y2="138" stroke="#ccc" />
                    <polyline
                      fill="none"
                      stroke="#111"
                      strokeWidth="2"
                      points={current.values
                        .map(
                          (v, i, a) =>
                            `${12 + (i / Math.max(1, a.length - 1)) * 576},${138 - (v / Math.max(1, ...a)) * 120}`,
                        )
                        .join(" ")}
                    />
                    <text x="12" y="12" fontSize="10" fill="#777">
                      Output history · exact values below
                    </text>
                  </svg>
                ))}
            </div>
          )}
          {showData && (
            <div className="sim-data-view" ref={dataRef}>
              <table className="sim-state-table">
                <caption>State at step {timeline.index + 1}</caption>
                <thead>
                  <tr>
                    {lesson.columns.map((c) => (
                      <th key={c} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {current.rows
                    .slice(
                      activePage * pageSize,
                      activePage * pageSize + pageSize,
                    )
                    .map((row, i) => (
                      <tr
                        key={i}
                        className={
                          current.active?.includes(activePage * pageSize + i)
                            ? "is-active"
                            : ""
                        }
                      >
                        {row.map((cell, j) => (
                          <td key={j} title={String(cell)}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="sim-pagination">
                <button
                  type="button"
                  disabled={activePage === 0}
                  onClick={() => setPage(activePage - 1)}
                >
                  ← Previous
                </button>
                <span>
                  {activePage + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={activePage + 1 >= pageCount}
                  onClick={() => setPage(activePage + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
        <ModelNotes>{lesson.assumptions}</ModelNotes>
      </div>
    </SimFrame>
  );
}
