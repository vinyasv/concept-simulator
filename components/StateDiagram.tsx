import React from "react";
import { Frame, Params } from "../simulations/model";

/** Diagrams consume the same model state as the table, so visual highlights cannot invent behavior. */
export function StateDiagram({
  id,
  state,
  params,
}: {
  id: string;
  state: Frame;
  params: Params;
}) {
  if (id === "cs_depth_first_search") {
    const points = [
      [70, 100],
      [220, 45],
      [220, 160],
      [390, 45],
      [390, 160],
      [530, 100],
    ];
    return (
      <svg
        className="sim-state-diagram"
        viewBox="0 0 600 210"
        role="img"
        aria-label="DFS graph; filled nodes are visited, outlined nodes are unvisited"
      >
        {state.rows.flatMap((row, i) =>
          String(row[1])
            .split(", ")
            .map(Number)
            .filter((j) => j > i)
            .map((j) => (
              <line
                key={`${i}-${j}`}
                x1={points[i][0]}
                y1={points[i][1]}
                x2={points[j][0]}
                y2={points[j][1]}
                stroke="#ccc"
              />
            )),
        )}
        {state.rows.map((row, i) => (
          <g key={i}>
            <circle
              cx={points[i][0]}
              cy={points[i][1]}
              r="21"
              fill={row[2] === "Unvisited" ? "white" : "#111"}
              stroke="#111"
            />
            <text
              x={points[i][0]}
              y={points[i][1] + 4}
              textAnchor="middle"
              fontSize="13"
              fill={row[2] === "Unvisited" ? "#111" : "white"}
            >
              {row[0]}
            </text>
            <text
              x={points[i][0]}
              y={points[i][1] + 39}
              textAnchor="middle"
              fontSize="10"
              fill="#777"
            >
              {row[2]}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  if (id === "cs_gradient_descent") {
    const x = Number(state.metrics?.x ?? params.x),
      clamped = Math.max(-8, Math.min(14, x));
    const px = (v: number) => 25 + ((v + 8) / 22) * 550,
      py = (v: number) => 185 - (Math.min(121, (v - 3) ** 2) / 121) * 155;
    const points = Array.from({ length: 100 }, (_, i) => {
      const v = -8 + (i / 99) * 22;
      return `${px(v)},${py(v)}`;
    });
    return (
      <svg
        className="sim-state-diagram"
        viewBox="0 0 600 220"
        role="img"
        aria-label={`Loss surface f(x)=(x−3)², current x=${x}`}
      >
        <line x1="25" x2="575" y1="185" y2="185" stroke="#ddd" />
        <polyline points={points.join(" ")} fill="none" stroke="#aaa" />
        <circle cx={px(clamped)} cy={py(clamped)} r="5" fill="#111" />
        <text x={px(3)} y="204" textAnchor="middle" fontSize="11">
          Minimum x=3
        </text>
        <text x="25" y="16" fontSize="11" fill="#777">
          f(x) = (x−3)²{" "}
          {x !== clamped ? "· current x is outside the plotted range" : ""}
        </text>
      </svg>
    );
  }
  if (id === "cs_binary_numbers") {
    const row = state.rows.find((r) => r[0] === "Binary");
    return (
      <div className="sim-bit-rows">
        {row?.slice(1).map((bits, i) => (
          <div key={i}>
            <span>{["A", "B", "Result"][i]}</span>
            {String(bits)
              .split("")
              .map((bit, j) => (
                <b key={j} className={bit === "1" ? "is-one" : ""}>
                  {bit}
                </b>
              ))}
          </div>
        ))}
      </div>
    );
  }
  if (id === "cs_cpu_pipelining")
    return (
      <div className="sim-pipeline">
        {state.rows.map((row) => (
          <div key={String(row[0])}>
            <span>{row[0]}</span>
            {["F", "D", "E", "M", "W"].map((stage) => (
              <b key={stage} className={row[1] === stage ? "is-current" : ""}>
                {stage}
              </b>
            ))}
          </div>
        ))}
      </div>
    );
  if (
    [
      "cs_arrays",
      "cs_stacks_queues",
      "cs_abstract_data_types",
      "cs_linked_lists",
      "cs_union_find",
      "cs_functions_call_stack",
      "cs_recursion",
      "cs_reinforcement_learning",
    ].includes(id)
  ) {
    return (
      <div className="sim-memory-strip">
        {state.rows.map((row, i) => (
          <div
            key={i}
            className={
              id === "cs_reinforcement_learning" &&
              Number(state.metrics?.Cell) === i
                ? "is-current"
                : ""
            }
          >
            <small>
              {id === "cs_reinforcement_learning"
                ? `Cell ${row[0]}`
                : id === "cs_union_find"
                  ? `Element ${row[0]}`
                  : `${row[0]}`}
            </small>
            <strong>
              {id === "cs_reinforcement_learning" ? row[3] : row[1]}
            </strong>
            {id === "cs_linked_lists" && <small>next → {row[2]}</small>}
            {id === "cs_union_find" && <small>parent pointer</small>}
          </div>
        ))}
      </div>
    );
  }
  if (id === "cs_packet_switching")
    return (
      <div className="sim-packet-lanes">
        {["Source", "Link 1", "Router", "Delivered", "Dropped"].map(
          (location) => (
            <div key={location}>
              <small>{location}</small>
              <div>
                {state.rows
                  .filter((row) => row[1] === location)
                  .map((row) => (
                    <b key={String(row[0])}>{row[0]}</b>
                  ))}
              </div>
            </div>
          ),
        )}
      </div>
    );
  return null;
}
