import React from "react";
import { Stat } from "../SimSDK";
import {
  Edge,
  traverseGraph,
  moveDisk,
  gradientStep,
} from "../../simulations/playground";
import { sortingLesson } from "../../simulations/algorithms";
import { Choices, Feedback, useMaterial, Workbench } from "./shared";
import {
  useSimulationTimeline,
  PlaybackControls,
} from "../../simulations/playback";

export function GraphBench() {
  const model = useMaterial({
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
    ] as Edge[],
    selected: null as number | null,
    start: 0,
    mode: "BFS" as "BFS" | "DFS",
    editing: "Connect nodes",
    show: false,
    message:
      "Click two nodes to add or remove their edge. Then compare BFS and DFS.",
  });
  const s = model.state,
    points = [
      [65, 120],
      [210, 55],
      [210, 190],
      [390, 55],
      [390, 190],
      [535, 120],
    ],
    order = traverseGraph(s.edges, s.start, s.mode);
  const click = (node: number) => {
    if (s.editing === "Choose start")
      return model.change({
        ...s,
        start: node,
        show: true,
        message: `Starting at node ${node}. ${s.mode} reaches ${traverseGraph(s.edges, node, s.mode).length} nodes.`,
      });
    if (s.selected === null)
      return model.change({
        ...s,
        selected: node,
        message: `Node ${node} selected. Choose another node to toggle their edge.`,
      });
    if (s.selected === node)
      return model.change({
        ...s,
        selected: null,
        message: "Selection cleared.",
      });
    const exists = s.edges.some(
      ([a, b]) =>
        (a === node && b === s.selected) || (b === node && a === s.selected),
    );
    const edges: Edge[] = exists
      ? s.edges.filter(
          ([a, b]) =>
            !(
              (a === node && b === s.selected) ||
              (b === node && a === s.selected)
            ),
        )
      : [...s.edges, [s.selected, node]];
    model.change({
      ...s,
      edges,
      selected: null,
      message: `${exists ? "Removed" : "Added"} edge ${s.selected} ↔ ${node}.`,
    });
  };
  return (
    <Workbench
      id="graph"
      model={model}
      assumptions="Six vertices, undirected unweighted edges. Neighbors are visited in ascending numeric order. BFS uses a queue, DFS a stack. The numbered overlay is the computed visit order; graph editing remains available."
      readings={
        <Stat label="Reachable from start" value={`${order.length} / 6`} />
      }
    >
      <div className="play-actions">
        <Choices
          label="Graph tool"
          values={["Connect nodes", "Choose start"]}
          value={s.editing}
          onChange={(editing) =>
            model.change({ ...s, editing, selected: null })
          }
        />
        <Choices
          label="Traversal"
          values={["BFS", "DFS"] as const}
          value={s.mode}
          onChange={(mode) =>
            model.change({
              ...s,
              mode,
              show: true,
              message: `${mode}: ${traverseGraph(s.edges, s.start, mode).join(" → ")}.`,
            })
          }
        />
        <button
          onClick={() =>
            model.change({
              ...s,
              show: !s.show,
              message: !s.show
                ? `${s.mode} visit order: ${order.join(" → ")}.`
                : "Visit order hidden. Change the graph or predict a path.",
            })
          }
        >
          {s.show ? "Hide order" : "Trace my graph"}
        </button>
      </div>
      <div className="play-graph">
        <svg
          viewBox="0 0 600 250"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {s.edges.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={points[a][0]}
              y1={points[a][1]}
              x2={points[b][0]}
              y2={points[b][1]}
            />
          ))}
        </svg>
        {points.map(([x, y], i) => (
          <button
            key={i}
            style={{ left: `${x / 6}%`, top: `${y / 2.5}%` }}
            className={`play-node ${s.start === i ? "is-on" : ""} ${s.selected === i ? "is-selected" : ""}`}
            aria-label={`Node ${i}${s.start === i ? ", start" : ""}`}
            onClick={() => click(i)}
          >
            {i}
            {s.show && (
              <small>
                {order.includes(i)
                  ? `visit ${order.indexOf(i) + 1}`
                  : "unreached"}
              </small>
            )}
          </button>
        ))}
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
const sortModes = {
  Bubble: "bubble",
  Insertion: "insertion",
  Merge: "merge",
  Quick: "quick",
} as const;
export function SortingBench() {
  const model = useMaterial({
    values: [6, 2, 5, 1, 4, 3],
    selected: null as number | null,
    mode: "Bubble" as keyof typeof sortModes,
    demo: false,
    message:
      "Choose two bars to swap them. Make an easy or difficult input for an algorithm.",
  });
  const s = model.state;
  const frames = React.useMemo(
    () =>
      sortingLesson(sortModes[s.mode]).run({
        items: s.values.join(","),
        order: "Custom",
      }),
    [s.values, s.mode],
  );
  const timeline = useSimulationTimeline(frames),
    visible = s.demo ? (timeline.frame.values ?? s.values) : s.values;
  const select = (index: number) => {
    if (s.selected === null)
      return model.change({
        ...s,
        selected: index,
        demo: false,
        message: `Selected ${s.values[index]}. Choose another bar to swap.`,
      });
    const values = [...s.values];
    [values[index], values[s.selected]] = [values[s.selected], values[index]];
    model.change({
      ...s,
      values,
      selected: null,
      demo: false,
      message: `Swapped positions ${s.selected} and ${index}. Your input is now ${values.join(", ")}.`,
    });
  };
  return (
    <Workbench
      id="sorting"
      model={model}
      assumptions="Six distinct integers. You may swap any pair to build input; demonstration runs the selected standard algorithm on that exact input. Comparisons and moves are counted from the real algorithm trace."
      readings={
        s.demo ? (
          Object.entries(timeline.frame.metrics ?? {})
            .slice(0, 3)
            .map(([label, value]) => (
              <Stat key={label} label={label} value={value} />
            ))
        ) : (
          <Stat
            label="Out-of-order adjacent pairs"
            value={s.values.slice(1).filter((v, i) => v < s.values[i]).length}
          />
        )
      }
    >
      <div className="play-actions">
        <Choices
          label="Sorting algorithm"
          values={Object.keys(sortModes) as (keyof typeof sortModes)[]}
          value={s.mode}
          onChange={(mode) => model.change({ ...s, mode, demo: false })}
        />
        <button
          onClick={() => {
            timeline.reset();
            model.change({
              ...s,
              selected: null,
              demo: !s.demo,
              message: s.demo
                ? "Edit your input again."
                : "Demonstrating your input. Step through the measured work, then try another arrangement.",
            });
          }}
        >
          {s.demo ? "Edit my input" : "Demonstrate my input"}
        </button>
        <button
          onClick={() =>
            model.change({
              ...s,
              values: [...s.values].reverse(),
              selected: null,
              demo: false,
              message: "Reversed the input. Try another algorithm on it.",
            })
          }
        >
          Reverse input
        </button>
      </div>
      <div className="play-sort-bars">
        {visible.map((value, i) => (
          <button
            key={i}
            className={`${s.selected === i || (s.demo && timeline.frame.active?.includes(i)) ? "is-selected" : ""}`}
            style={{ height: `${25 + value * 10}%` }}
            aria-label={`Bar ${value} at position ${i}`}
            onClick={() => select(i)}
            disabled={s.demo}
          >
            <b>{value}</b>
            <small>{i}</small>
          </button>
        ))}
      </div>
      {s.demo && <PlaybackControls timeline={timeline} />}
      <Feedback>{s.demo ? timeline.frame.explanation : s.message}</Feedback>
    </Workbench>
  );
}
export function HanoiBench() {
  const model = useMaterial({
    towers: [[3, 2, 1], [], []] as number[][],
    selected: null as number | null,
    moves: 0,
    message:
      "Choose a tower to pick up its top disk, then choose a destination.",
  });
  const s = model.state;
  const click = (to: number) => {
    if (s.selected === null)
      return model.change({
        ...s,
        selected: s.towers[to].length ? to : null,
        message: s.towers[to].length
          ? `Picked up disk ${s.towers[to].at(-1)}. Choose a destination tower.`
          : "This tower is empty. Pick a disk from another tower.",
      });
    if (s.selected === to)
      return model.change({
        ...s,
        selected: null,
        message: "Put the disk back.",
      });
    const towers = moveDisk(s.towers, s.selected, to);
    model.change({
      ...s,
      towers,
      selected: null,
      moves: s.moves + Number(towers !== s.towers),
      message:
        towers === s.towers
          ? "A larger disk cannot sit on a smaller one. Try another destination."
          : towers[2].length === 3
            ? `The tower reached the right peg in ${s.moves + 1} moves. Can you do it in seven?`
            : `Moved disk ${s.towers[s.selected].at(-1)} to tower ${to + 1}.`,
    });
  };
  return (
    <Workbench
      id="hanoi"
      model={model}
      assumptions="Three disks and three pegs. Move only a top disk; never place a larger disk on a smaller one. The minimum number of moves is 2³ − 1 = 7."
      readings={<Stat label="Moves" value={s.moves} />}
    >
      <div className="play-hanoi">
        {s.towers.map((tower, i) => (
          <button
            key={i}
            className={`play-tower ${s.selected === i ? "is-selected" : ""}`}
            aria-label={`Tower ${i + 1}, disks ${tower.join(",") || "empty"}`}
            onClick={() => click(i)}
          >
            <span className="play-peg" />
            {tower.map((disk) => (
              <span
                className="play-disk"
                key={disk}
                style={{ width: `${disk * 24 + 20}%` }}
              >
                {disk}
              </span>
            ))}
            <small>Tower {i + 1}</small>
          </button>
        ))}
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function GradientBench() {
  const model = useMaterial({
      x: -4,
      rate: 0.1,
      trail: [-4],
      message:
        "Place the point anywhere on the curve, then take a gradient step.",
    }),
    s = model.state;
  const px = (x: number) => 25 + ((x + 6) / 18) * 550,
    py = (x: number) => 225 - (Math.min(81, (x - 3) ** 2) / 81) * 190;
  const step = () => {
    const next = gradientStep(s.x, s.rate);
    if (Math.abs(next) > 1e6)
      return model.change({
        ...s,
        message:
          "This rate has driven the point beyond the experiment's bound. Undo or place it back on the curve.",
      });
    model.change({
      ...s,
      x: next,
      trail: [...s.trail.slice(-11), next],
      message: `${s.x.toFixed(2)} → ${next.toFixed(2)}. Loss ${((s.x - 3) ** 2).toFixed(2)} → ${((next - 3) ** 2).toFixed(2)}.${Math.abs(next - 3) > Math.abs(s.x - 3) ? " The step moved farther from the minimum." : ""}`,
    });
  };
  return (
    <Workbench
      id="gradient"
      model={model}
      assumptions="One-dimensional quadratic loss L(x)=(x−3)². Each step is x ← x−rate·2(x−3). Dots show recent iterates; positions outside the visible interval are reported rather than wrapped."
      readings={
        <>
          <Stat label="x" value={s.x.toFixed(3)} />
          <Stat label="Loss" value={((s.x - 3) ** 2).toFixed(3)} />
        </>
      }
    >
      <div className="play-actions">
        <Choices
          label="Learning rate"
          values={["0.1", "0.5", "0.9", "1.1"]}
          value={String(s.rate)}
          onChange={(rate) =>
            model.change({
              ...s,
              rate: Number(rate),
              message: `Learning rate ${rate}; the point stays where you placed it.`,
            })
          }
        />
        <button className="play-primary" onClick={step}>
          Take a gradient step
        </button>
      </div>
      <div className="play-curve">
        <svg
          viewBox="0 0 600 270"
          preserveAspectRatio="none"
          onPointerDown={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = Math.max(
              -6,
              Math.min(
                12,
                ((((event.clientX - bounds.left) / bounds.width) * 600 - 25) /
                  550) *
                  18 -
                  6,
              ),
            );
            model.change({
              ...s,
              x,
              trail: [x],
              message: `Placed the point at x = ${x.toFixed(2)}.`,
            });
          }}
          role="img"
          aria-label="Quadratic loss curve with recent gradient steps"
        >
          <path
            d={Array.from({ length: 100 }, (_, i) => {
              const x = -6 + (i / 99) * 18;
              return `${i ? "L" : "M"}${px(x)},${py(x)}`;
            }).join(" ")}
            fill="none"
            stroke="#aeb7bc"
            strokeWidth="2"
          />
        </svg>
        {s.trail.map((x, i) =>
          x >= -6 && x <= 12 ? (
            <span
              key={i}
              className="play-loss-dot"
              style={{
                left: `${px(x) / 6}%`,
                top: `${py(x) / 2.7}%`,
                opacity: (i + 1) / s.trail.length,
                width: i === s.trail.length - 1 ? 10 : 5,
                height: i === s.trail.length - 1 ? 10 : 5,
              }}
            />
          ) : null,
        )}
        <small className="play-loss-label">Minimum: x = 3</small>
      </div>
      <div className="play-actions" aria-label="Place the point">
        <small>Place x:</small>
        {[-6, -3, 0, 3, 6, 9, 12].map((x) => (
          <button
            key={x}
            aria-label={`Place point at ${x}`}
            onClick={() =>
              model.change({
                ...s,
                x,
                trail: [x],
                message: `Placed the point at x = ${x}.`,
              })
            }
          >
            {x}
          </button>
        ))}
      </div>
      <Feedback>
        {s.x < -6 || s.x > 12
          ? `${s.message} Current x is outside the plotted interval.`
          : s.message}
      </Feedback>
    </Workbench>
  );
}
