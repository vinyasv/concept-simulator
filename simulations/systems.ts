import { Lesson, Frame, num, choice, frame } from "./model";

const race: Lesson = {
  assumptions:
    "Two threads each increment a shared integer once. An increment consists of a separate read and write; a mutex makes each read/write pair indivisible.",
  columns: ["Shared value", "Thread A local", "Thread B local"],
  parameters: [
    choice("lock", "Mutex", ["Off", "On"]),
    num("initial", "Initial counter", 0, 0, 10),
  ],
  run: (p) => {
    let shared = Number(p.initial),
      a: number | string = "—",
      b: number | string = "—";
    const out: Frame[] = [];
    const record = (s: string) =>
      out.push(
        frame(s, [[shared, a, b]], {
          Expected: Number(p.initial) + 2,
          Actual: shared,
        }),
      );
    record("Both threads are ready.");
    a = shared;
    record("A reads the shared counter.");
    if (p.lock === "On") {
      shared = Number(a) + 1;
      record("A writes while holding the mutex, then releases it.");
      b = shared;
      record("B acquires the mutex and reads the updated counter.");
    } else {
      b = shared;
      record("B reads before A writes. Both now hold the same old value.");
      shared = Number(a) + 1;
      record("A writes local + 1.");
    }
    shared = Number(b) + 1;
    record(
      p.lock === "On"
        ? "B writes and releases the mutex. Both increments are preserved."
        : "B overwrites A’s update. One increment is lost.",
    );
    return out;
  },
};
const scheduling = (context = false): Lesson => ({
  assumptions: context
    ? "Two threads alternate after each quantum. Each switch costs one time unit; state is saved before the other thread resumes."
    : "Three jobs arrive at time zero with bursts 5, 3, 1. FCFS and SJF are non-preemptive; round robin uses the selected quantum. No I/O or switch overhead.",
  columns: ["Process", "Remaining work", "Completion time"],
  parameters: context
    ? [num("q", "Time quantum", 2, 1, 5)]
    : [
        choice("policy", "Scheduling policy", ["FCFS", "SJF", "Round robin"]),
        num("q", "Time quantum", 2, 1, 5),
      ],
  run: (p) => {
    const bursts = context ? [5, 3] : [5, 3, 1],
      remaining = [...bursts],
      completed = bursts.map(() => 0),
      queue = bursts.map((_, i) => i),
      out: Frame[] = [];
    let time = 0,
      switches = 0,
      last = -1;
    if (p.policy === "SJF") queue.sort((a, b) => bursts[a] - bursts[b]);
    const record = (s: string) =>
      out.push(
        frame(
          s,
          remaining.map((v, i) => [`P${i + 1}`, v, completed[i] || "—"]),
          { Time: time, ...(context ? { Switches: switches } : {}) },
        ),
      );
    record("All processes enter the ready queue.");
    while (queue.length) {
      const i = queue.shift()!;
      if (context && last !== -1 && last !== i) {
        time++;
        switches++;
        record(
          `Save P${last + 1} and restore P${i + 1}; switch costs one time unit.`,
        );
      }
      const slice =
        context || p.policy === "Round robin"
          ? Math.min(Number(p.q), remaining[i])
          : remaining[i];
      remaining[i] -= slice;
      time += slice;
      if (!remaining[i]) completed[i] = time;
      else queue.push(i);
      record(
        `P${i + 1} executes ${slice} time units${remaining[i] ? " and returns to the queue" : " and completes"}.`,
      );
      last = i;
    }
    if (!context)
      out.push(
        frame(
          "Waiting time = completion − burst, because all arrivals were at time zero.",
          bursts.map((b, i) => [`P${i + 1}`, 0, completed[i]]),
          {
            "Mean wait": Number(
              (
                completed.reduce((s, c, i) => s + c - bursts[i], 0) /
                bursts.length
              ).toFixed(2),
            ),
          },
        ),
      );
    return out;
  },
});
export const systemLessons: Record<string, Lesson> = {
  cs_race_conditions: race,
  cs_synchronization: race,
  cs_process_scheduling: scheduling(),
  cs_context_switching: scheduling(true),
  cs_instruction_cycle: {
    assumptions:
      "Toy accumulator CPU executes LOAD n, ADD 3, STORE result. Each instruction has fetch, decode, execute stages; PC counts instructions.",
    columns: ["Register / memory", "Value"],
    parameters: [num("n", "Loaded value", 5, 0, 20)],
    run: (p) => {
      let acc = 0,
        stored: number | string = "—";
      const out: Frame[] = [];
      for (let pc = 0; pc < 3; pc++) {
        const instruction = [`LOAD ${p.n}`, "ADD 3", "STORE result"][pc];
        const rows = () => [
          ["PC", pc],
          ["IR", instruction],
          ["Accumulator", acc],
          ["result", stored],
        ];
        out.push(frame(`Fetch instruction ${pc}.`, rows()));
        out.push(frame(`Decode ${instruction}.`, rows()));
        if (pc === 0) acc = Number(p.n);
        if (pc === 1) acc += 3;
        if (pc === 2) stored = acc;
        out.push(frame(`Execute ${instruction}.`, rows()));
      }
      return out;
    },
  },
  cs_cpu_pipelining: {
    assumptions:
      "Five-stage pipeline (F,D,E,M,W), four instructions. I2 consumes I1’s result. Without forwarding, I2 stalls in decode until I1 writes back; forwarding removes those stalls. No other hazards.",
    columns: ["Instruction", "Current stage"],
    parameters: [choice("forward", "Forwarding", ["On", "Off"])],
    run: (p) => {
      const stages = ["F", "D", "E", "M", "W"],
        positions = [-1, -2, -3, -4],
        out: Frame[] = [];
      let cycle = 0,
        stalls = 0;
      while (positions.some((s) => s < 5) && cycle < 15) {
        cycle++;
        const stall =
          p.forward === "Off" && positions[1] === 1 && positions[0] < 4;
        for (let i = 0; i < 4; i++) {
          if (stall && i >= 1) continue;
          positions[i]++;
        }
        if (stall) stalls++;
        out.push(
          frame(
            stall
              ? "Hold I2 in decode and freeze younger instructions; I1 has not written its result."
              : `Advance pipeline cycle ${cycle}.`,
            positions.map((s, i) => [
              `I${i + 1}${i === 1 ? " (uses I1)" : ""}`,
              s < 0 ? "Waiting" : s > 4 ? "Done" : stages[s],
            ]),
            { Cycle: cycle, Stalls: stalls },
          ),
        );
      }
      return out;
    },
  },
  cs_cache_hierarchy: {
    assumptions:
      "Two fully associative LRU caches: configurable L1 and four-line L2. Misses fill both; each hit refreshes its level. Illustrative access costs: L1=1, L2=5, memory=30 cycles.",
    columns: ["Level", "Lines (LRU → MRU)"],
    parameters: [
      num("capacity", "L1 lines", 2, 1, 3),
      choice("pattern", "Access pattern", ["Local", "Streaming"]),
    ],
    run: (p) => {
      const l1: number[] = [],
        l2: number[] = [],
        requests =
          p.pattern === "Local"
            ? [1, 2, 1, 2, 3, 1, 4, 2, 1]
            : [1, 2, 3, 4, 5, 6, 7, 8, 9],
        out: Frame[] = [];
      let hits = 0,
        cycles = 0;
      const touch = (a: number[], v: number, max: number) => {
        const i = a.indexOf(v);
        if (i >= 0) a.splice(i, 1);
        a.push(v);
        if (a.length > max) a.shift();
      };
      for (const [i, v] of requests.entries()) {
        const level = l1.includes(v) ? "L1" : l2.includes(v) ? "L2" : "Memory";
        if (level === "L1") hits++;
        cycles += level === "L1" ? 1 : level === "L2" ? 5 : 30;
        touch(l1, v, Number(p.capacity));
        if (level !== "L1") touch(l2, v, 4);
        out.push(
          frame(
            `Read line ${v}: served by ${level}.`,
            [
              ["L1", l1.join(", ")],
              ["L2", l2.join(", ")],
            ],
            { "L1 hits": hits, Accesses: i + 1, Cycles: cycles },
          ),
        );
      }
      return out;
    },
  },
  cs_virtual_memory: {
    assumptions:
      "Page size 16 bytes, three physical frames, FIFO page replacement. This model omits TLB and disk latency.",
    columns: ["Physical frame", "Virtual page"],
    parameters: [num("offset", "Address offset", 3, 0, 15)],
    run: (p) => {
      const pages = [0, 1, 2, 0, 3, 1, 4],
        frames: number[] = [],
        out: Frame[] = [];
      let faults = 0,
        next = 0;
      for (const page of pages) {
        let f = frames.indexOf(page);
        const hit = f >= 0;
        if (!hit) {
          faults++;
          f = frames.length < 3 ? frames.length : next;
          frames[f] = page;
          next = (f + 1) % 3;
        }
        const addr = page * 16 + Number(p.offset);
        out.push(
          frame(
            `Virtual ${addr} = page ${page} + offset ${p.offset}. ${hit ? "Hit" : "Page fault"} → physical address ${f * 16 + Number(p.offset)}.`,
            frames.map((v, i) => [i, v]),
            { "Page faults": faults },
          ),
        );
      }
      return out;
    },
  },
  cs_branch_prediction: {
    assumptions:
      "Predict before observing each branch. Two-bit counter ranges 0–3, predicts taken at 2–3, starts weakly not-taken. No pipeline timing model.",
    columns: ["Branch", "Prediction", "Actual", "Correct", "Counter after"],
    parameters: [
      choice("predictor", "Predictor", ["Two-bit", "Always taken"]),
      choice("pattern", "Branch pattern", ["Loop", "Alternating"]),
    ],
    run: (p) => {
      const outcomes =
          p.pattern === "Loop"
            ? [1, 1, 1, 0, 1, 1, 1, 0]
            : [1, 0, 1, 0, 1, 0, 1, 0],
        rows: Frame["rows"] = [],
        out: Frame[] = [];
      let state = 1,
        hits = 0;
      outcomes.forEach((v, i) => {
        const prediction =
          p.predictor === "Always taken" ? 1 : Number(state >= 2);
        if (prediction === v) hits++;
        state = Math.max(0, Math.min(3, state + (v ? 1 : -1)));
        rows.push([
          i + 1,
          prediction ? "Taken" : "Not taken",
          v ? "Taken" : "Not taken",
          prediction === v ? "Yes" : "No",
          state,
        ]);
        out.push(
          frame(
            `Observe branch ${i + 1} after predicting it, then update the counter.`,
            [...rows],
            {
              "Correct predictions": hits,
              Accuracy: `${Math.round((hits / (i + 1)) * 100)}%`,
            },
          ),
        );
      });
      return out;
    },
  },
  cs_deadlock: {
    assumptions:
      "Two processes and two exclusive resources. A wait cycle is a deadlock here because each resource has one instance and neither process releases while waiting.",
    columns: ["Process", "Holds", "Waiting for"],
    parameters: [
      choice("order", "Acquisition order", ["Opposite", "Consistent"]),
    ],
    run: (p) =>
      p.order === "Opposite"
        ? [
            frame("P1 acquires A.", [
              ["P1", "A", "—"],
              ["P2", "—", "—"],
            ]),
            frame("P2 acquires B.", [
              ["P1", "A", "—"],
              ["P2", "B", "—"],
            ]),
            frame("P1 waits for B, held by P2.", [
              ["P1", "A", "B"],
              ["P2", "B", "—"],
            ]),
            frame(
              "P2 waits for A. The cycle P1 → P2 → P1 prevents progress.",
              [
                ["P1", "A", "B"],
                ["P2", "B", "A"],
              ],
              { Deadlock: "Yes" },
            ),
          ]
        : [
            frame("Both request A first. P2 waits while P1 holds A.", [
              ["P1", "A", "—"],
              ["P2", "—", "A"],
            ]),
            frame("P1 acquires B, completes, and releases both resources.", [
              ["P1", "—", "Done"],
              ["P2", "—", "A"],
            ]),
            frame(
              "P2 can now acquire A then B and complete.",
              [
                ["P1", "—", "Done"],
                ["P2", "—", "Done"],
              ],
              { Deadlock: "No" },
            ),
          ],
  },
  cs_file_systems: {
    assumptions:
      "Toy inode with a direct block list; block size four bytes. Noncontiguous free blocks demonstrate that logical file order differs from physical location.",
    columns: ["Logical block", "Physical block", "Bytes used"],
    parameters: [num("bytes", "File size (bytes)", 11, 1, 24)],
    run: (p) => {
      const free = [2, 7, 3, 9, 12, 5],
        out: Frame[] = [];
      for (let i = 0; i < Math.ceil(Number(p.bytes) / 4); i++) {
        out.push(
          frame(
            `Allocate physical block ${free[i]} and append its address to the inode.`,
            free
              .slice(0, i + 1)
              .map((b, j) => [j, b, Math.min(4, Number(p.bytes) - j * 4)]),
            { "Allocated bytes": 4 * (i + 1), "File bytes": Number(p.bytes) },
          ),
        );
      }
      return out;
    },
  },
  cs_btree_indexes: {
    assumptions:
      "Search an existing B-tree with root [20,40] and three leaves. Keys are compared within a node before selecting a child. This lesson focuses on lookup, not insertion.",
    columns: ["Node", "Keys", "Action"],
    parameters: [num("key", "Search key", 35, 5, 55, 5)],
    run: (p) => {
      const key = Number(p.key),
        root = [20, 40],
        leaves = [
          [5, 10, 15],
          [25, 30, 35],
          [45, 50, 55],
        ],
        branch = key < 20 ? 0 : key < 40 ? 1 : 2;
      const out = [
        frame(
          `Compare ${key} with root separators 20 and 40.`,
          [["Root", "20, 40", "Search"]],
          { "Nodes read": 1 },
        ),
      ];
      if (root.includes(key))
        out.push(
          frame("Key found in the root.", [["Root", "20, 40", "Found"]], {
            "Nodes read": 1,
          }),
        );
      else
        out.push(
          frame(
            `Follow child ${branch}; ${leaves[branch].includes(key) ? "key found" : "key absent"}.`,
            [
              [
                `Leaf ${branch}`,
                leaves[branch].join(", "),
                leaves[branch].includes(key) ? "Found" : "Absent",
              ],
            ],
            { "Nodes read": 2 },
          ),
        );
      return out;
    },
  },
  cs_relational_joins: {
    assumptions:
      "Inner equijoin: left keys [1,2,2], right keys [2,3]. Nested loop compares each pair; hash join builds buckets then probes once per left row.",
    columns: ["Left row", "Right row", "Joined key"],
    parameters: [
      choice("method", "Join algorithm", ["Nested loop", "Hash join"]),
    ],
    run: (p) => {
      const left = [1, 2, 2],
        right = [2, 3],
        rows: Frame["rows"] = [],
        out: Frame[] = [];
      let work = 0;
      if (p.method === "Hash join") {
        const buckets = new Map<number, number[]>();
        right.forEach((k, i) => buckets.set(k, [...(buckets.get(k) || []), i]));
        work += right.length;
        out.push(
          frame("Build a hash table on the right keys.", [], {
            "Build / probe operations": work,
          }),
        );
        left.forEach((k, i) => {
          work++;
          for (const j of buckets.get(k) || []) rows.push([i, j, k]);
          out.push(
            frame(`Probe bucket ${k}; emit each matching pair.`, [...rows], {
              "Build / probe operations": work,
            }),
          );
        });
      } else
        left.forEach((a, i) =>
          right.forEach((b, j) => {
            work++;
            if (a === b) rows.push([i, j, a]);
            out.push(
              frame(
                `Compare left ${i} (${a}) and right ${j} (${b}): ${a === b ? "match" : "different"}.`,
                [...rows],
                { Comparisons: work },
              ),
            );
          }),
        );
      return out;
    },
  },
  cs_query_planning: {
    assumptions:
      "Illustrative nested-loop cost model: read N left rows and compare each surviving left row with 100 right rows. Selectivity is exact in this toy data; costs are operations, not milliseconds.",
    columns: ["Plan", "Left rows read", "Join comparisons", "Total work"],
    parameters: [
      num("n", "Left rows", 100, 10, 1000, 10),
      num("selectivity", "Filter selectivity (%)", 10, 0, 100, 10),
    ],
    run: (p) => {
      const n = Number(p.n),
        k = (n * Number(p.selectivity)) / 100;
      return [
        frame("Join before filtering examines all N × 100 pairs.", [
          ["Join → filter", n, n * 100, n + n * 100],
        ]),
        frame(
          `Push the filter before the join: only ${k} left rows reach it.`,
          [
            ["Join → filter", n, n * 100, n + n * 100],
            ["Filter → join", n, k * 100, n + k * 100],
          ],
          { "Work saved": (n - k) * 100 },
        ),
      ];
    },
  },
  cs_acid_transactions: {
    assumptions:
      "Single transfer transaction with private working balances. Readers see committed values; a failed transaction discards both writes. Durability is described, not a disk crash simulation.",
    columns: ["View", "Account A", "Account B", "Total"],
    parameters: [
      num("amount", "Transfer amount", 30, 0, 100),
      choice("outcome", "Outcome", ["Commit", "Fail after debit"]),
    ],
    run: (p) => {
      const n = Number(p.amount);
      return [
        frame("Begin transaction; committed balances total 200.", [
          ["Committed", 100, 100, 200],
        ]),
        frame(
          "Debit in private working state; readers still see the committed balances.",
          [
            ["Committed", 100, 100, 200],
            ["Working", 100 - n, 100, 200 - n],
          ],
        ),
        p.outcome === "Commit"
          ? frame(
              "Credit B and publish both changes atomically at commit.",
              [["Committed", 100 - n, 100 + n, 200]],
              { Status: "Committed" },
            )
          : frame(
              "Failure before credit: roll back the private changes.",
              [["Committed", 100, 100, 200]],
              { Status: "Rolled back" },
            ),
      ];
    },
  },
};
