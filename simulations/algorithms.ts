import { Lesson, Frame, num, choice, frame, seededRandom } from "./model";

export function sortingLesson(
  algorithm: "insertion" | "merge" | "quick" | "bubble",
): Lesson {
  return {
    assumptions:
      "Integer inputs. Each step records an actual comparison or move. Playback speed does not change the algorithm. Merge sort uses temporary storage.",
    columns: ["Index", "Value"],
    parameters: [
      num("n", "Input size", 8, 2, 16),
      num("seed", "Input seed", 7, 1, 100),
      choice("order", "Input order", [
        "Shuffled",
        "Sorted",
        "Reversed",
        "Duplicates",
      ]),
    ],
    run: (p) => {
      const random = seededRandom(Number(p.seed));
      const a = Array.from({ length: Number(p.n) }, () =>
        p.order === "Duplicates"
          ? Math.floor(random() * 4) + 1
          : Math.floor(random() * 90) + 10,
      );
      if (p.order === "Sorted") a.sort((a, b) => a - b);
      if (p.order === "Reversed") a.sort((a, b) => b - a);
      let comparisons = 0,
        writes = 0;
      const frames: Frame[] = [];
      const record = (text: string, active: number[] = []) =>
        frames.push({
          ...frame(
            text,
            a.map((v, i) => [i, v]),
            { Comparisons: comparisons, "Array writes": writes },
          ),
          values: [...a],
          active,
        });
      record(
        "The input stays the same throughout this run; the algorithm rearranges its values.",
      );
      if (algorithm === "insertion") {
        for (let i = 1; i < a.length; i++) {
          let j = i;
          while (j > 0) {
            comparisons++;
            record(
              `Compare ${a[j - 1]} with ${a[j]}. The prefix before index ${i} is sorted.`,
              [j - 1, j],
            );
            if (a[j - 1] <= a[j]) break;
            [a[j - 1], a[j]] = [a[j], a[j - 1]];
            writes += 2;
            record(
              `Move ${a[j - 1]} left; ${a[j]} shifts right. Adjacent exchanges preserve every input value.`,
              [j - 1, j],
            );
            j--;
          }
        }
      } else if (algorithm === "bubble") {
        for (let end = a.length - 1; end > 0; end--) {
          let swapped = false;
          for (let j = 0; j < end; j++) {
            comparisons++;
            record(`Compare neighbors ${a[j]} and ${a[j + 1]}.`, [j, j + 1]);
            if (a[j] > a[j + 1]) {
              [a[j], a[j + 1]] = [a[j + 1], a[j]];
              writes += 2;
              swapped = true;
              record("Swap this inverted pair.", [j, j + 1]);
            }
          }
          if (!swapped) break;
        }
      } else if (algorithm === "quick") {
        const sort = (lo: number, hi: number) => {
          if (lo >= hi) return;
          const pivot = a[hi];
          let boundary = lo;
          record(
            `Partition indices ${lo}–${hi} around the last value, ${pivot}.`,
            [hi],
          );
          for (let j = lo; j < hi; j++) {
            comparisons++;
            record(`Is ${a[j]} ≤ pivot ${pivot}?`, [j, hi]);
            if (a[j] <= pivot) {
              if (j !== boundary) {
                [a[j], a[boundary]] = [a[boundary], a[j]];
                writes += 2;
                record("Move this value into the lower partition.", [
                  j,
                  boundary,
                ]);
              }
              boundary++;
            }
          }
          if (boundary !== hi) {
            [a[boundary], a[hi]] = [a[hi], a[boundary]];
            writes += 2;
          }
          record(`Pivot ${pivot} is now at its final index ${boundary}.`, [
            boundary,
          ]);
          sort(lo, boundary - 1);
          sort(boundary + 1, hi);
        };
        sort(0, a.length - 1);
      } else {
        const sort = (lo: number, hi: number) => {
          if (hi - lo <= 1) return;
          const mid = Math.floor((lo + hi) / 2);
          sort(lo, mid);
          sort(mid, hi);
          const left = a.slice(lo, mid),
            right = a.slice(mid, hi),
            merged: number[] = [];
          let i = 0,
            j = 0;
          while (i < left.length && j < right.length) {
            comparisons++;
            record(
              `Merge: compare ${left[i]} from the left run with ${right[j]} from the right.`,
              [lo + i, mid + j],
            );
            merged.push(left[i] <= right[j] ? left[i++] : right[j++]);
          }
          merged.push(...left.slice(i), ...right.slice(j));
          a.splice(lo, hi - lo, ...merged);
          writes += merged.length;
          record(
            `Write the merged run at indices ${lo}–${hi - 1}: ${merged.join(", ")}.`,
            Array.from({ length: hi - lo }, (_, i) => lo + i),
          );
        };
        sort(0, a.length);
      }
      record(
        "Finished: values are in ascending order. Try a sorted or reversed input and compare the measured operations.",
      );
      return frames;
    },
  };
}
const factorial: Lesson = {
  assumptions:
    "Recursive factorial with base case 0! = 1. Stack frames remain live until their child returns.",
  columns: ["Stack depth", "Call / result"],
  parameters: [num("n", "Factorial input", 5, 0, 8)],
  run: (p) => {
    const frames: Frame[] = [],
      stack: string[] = [];
    const record = (text: string) =>
      frames.push(
        frame(
          text,
          stack.map((s, i) => [i, s]),
          { "Live frames": stack.length },
        ),
      );
    const visit = (n: number): number => {
      stack.push(`factorial(${n})`);
      record(`Enter factorial(${n}).`);
      const result = n === 0 ? 1 : n * visit(n - 1);
      stack[stack.length - 1] = `factorial(${n}) = ${result}`;
      record(
        n === 0
          ? "Base case returns 1."
          : `Multiply ${n} by the returned child result to get ${result}.`,
      );
      stack.pop();
      return result;
    };
    const result = visit(Number(p.n));
    frames.push(
      frame(`All frames returned. ${p.n}! = ${result}.`, [["Result", result]], {
        Result: result,
      }),
    );
    return frames;
  },
};
export const algorithmLessons: Record<string, Lesson> = {
  cs_insertion_sort: sortingLesson("insertion"),
  cs_merge_sort: sortingLesson("merge"),
  cs_quicksort: sortingLesson("quick"),
  bubble: sortingLesson("bubble"),
  cs_recursion: factorial,
  cs_functions_call_stack: factorial,
  cs_depth_first_search: {
    assumptions:
      "Undirected graph, ascending neighbor order. A vertex is marked when first visited; already visited neighbors are skipped.",
    columns: ["Vertex", "Neighbors", "Status"],
    parameters: [num("start", "Start vertex", 0, 0, 5)],
    run: (p) => {
      const edges = [
          [1, 2],
          [0, 3, 4],
          [0, 4],
          [1, 5],
          [1, 2, 5],
          [3, 4],
        ],
        seen = new Set<number>(),
        stack: number[] = [],
        out: Frame[] = [];
      const record = (text: string) =>
        out.push(
          frame(
            text,
            edges.map((e, i) => [
              i,
              e.join(", "),
              stack.includes(i)
                ? "On call stack"
                : seen.has(i)
                  ? "Visited"
                  : "Unvisited",
            ]),
            { Visited: seen.size, Stack: stack.join(" → ") || "Empty" },
          ),
        );
      record("Start with an empty visited set.");
      const visit = (v: number) => {
        seen.add(v);
        stack.push(v);
        record(`Discover vertex ${v}.`);
        for (const w of edges[v]) {
          if (!seen.has(w)) visit(w);
          else record(`Skip neighbor ${w}: already visited.`);
        }
        stack.pop();
        record(`Backtrack from ${v}; all its neighbors have been explored.`);
      };
      visit(Number(p.start));
      return out;
    },
  },
  cs_dynamic_programming: {
    assumptions:
      "Bottom-up Fibonacci, F(0)=0 and F(1)=1. Each new subproblem is evaluated once and retained.",
    columns: ["Subproblem", "Value"],
    parameters: [num("n", "Fibonacci index", 8, 2, 20)],
    run: (p) => {
      const a = [0, 1],
        out = [
          frame(
            "Initialize the two base cases.",
            [
              [0, 0],
              [1, 1],
            ],
            { Additions: 0 },
          ),
        ];
      for (let i = 2; i <= Number(p.n); i++) {
        a.push(a[i - 1] + a[i - 2]);
        out.push(
          frame(
            `F(${i}) = F(${i - 1}) + F(${i - 2}) = ${a[i]}. Reuse both stored results.`,
            a.map((v, i) => [i, v]),
            { Additions: i - 1 },
          ),
        );
      }
      return out;
    },
  },
  cs_algorithmic_complexity: {
    assumptions:
      "Illustrative growth functions, not timings or exact costs of every algorithm. Logarithms use base 2; exponential growth is 2^n.",
    columns: ["n", "1", "log₂ n", "n", "n log₂ n", "n²", "2ⁿ"],
    parameters: [num("n", "Maximum input size", 12, 2, 20)],
    run: (p) =>
      Array.from({ length: Number(p.n) }, (_, i) => {
        const n = i + 1;
        return frame(
          `At n=${n}, quadratic work is ${n * n} and exponential work is ${2 ** n}.`,
          Array.from({ length: n }, (_, j) => {
            const x = j + 1;
            return [
              x,
              1,
              Number(Math.log2(x).toFixed(2)),
              x,
              Number((x * Math.log2(x)).toFixed(2)),
              x * x,
              2 ** x,
            ];
          }),
        );
      }),
  },
};
