import { Lesson, Frame, num, choice, input, frame } from "./model";

const collection: Lesson = {
  assumptions:
    "A finite sequence of integer insertions followed by removals. Stack removes newest, queue removes oldest, set ignores duplicates.",
  columns: ["Position", "Value"],
  parameters: [
    input("items", "Values (comma separated)", "3, 1, 3, 7"),
    choice("kind", "Interface", ["Stack", "Queue", "Set"]),
  ],
  run: (p) => {
    const items = String(p.items)
        .split(",")
        .slice(0, 16)
        .map((s) => Number(s.trim()))
        .filter(Number.isFinite),
      a: number[] = [],
      out: Frame[] = [];
    const record = (s: string) =>
      out.push(
        frame(
          s,
          a.map((v, i) => [i, v]),
          { Size: a.length },
        ),
      );
    record("Begin with an empty collection.");
    for (const v of items) {
      if (p.kind === "Set" && a.includes(v)) {
        record(
          `Set already contains ${v}; duplicate insertion changes nothing.`,
        );
        continue;
      }
      a.push(v);
      record(`Insert ${v}.`);
    }
    while (a.length) {
      const v = p.kind === "Stack" ? a.pop() : a.shift();
      record(
        `Remove ${v}${p.kind === "Stack" ? " from the top" : p.kind === "Queue" ? " from the front" : " from this set"}.`,
      );
    }
    return out;
  },
};
export const foundationLessons: Record<string, Lesson> = {
  cs_binary_numbers: {
    assumptions:
      "Unsigned 8-bit integers. NOT and left shift are masked to eight bits; right shift is logical.",
    columns: ["Representation", "A", "B", "Result"],
    parameters: [
      num("a", "Operand A", 42, 0, 255),
      num("b", "Operand B", 15, 0, 255),
      choice("op", "Operation", [
        "AND",
        "OR",
        "XOR",
        "NOT A",
        "A << 1",
        "A >> 1",
      ]),
    ],
    run: (p) => {
      const a = Number(p.a),
        b = Number(p.b),
        op = p.op,
        r =
          op === "AND"
            ? a & b
            : op === "OR"
              ? a | b
              : op === "XOR"
                ? a ^ b
                : op === "NOT A"
                  ? ~a & 255
                  : op === "A << 1"
                    ? (a << 1) & 255
                    : a >>> 1;
      return [
        frame("Read both operands in three equivalent representations.", [
          ["Decimal", a, b, "—"],
          [
            "Binary",
            a.toString(2).padStart(8, "0"),
            b.toString(2).padStart(8, "0"),
            "—",
          ],
        ]),
        frame(
          `Apply ${op} independently to each bit (shifts move bit positions).`,
          [
            ["Decimal", a, b, r],
            [
              "Binary",
              a.toString(2).padStart(8, "0"),
              b.toString(2).padStart(8, "0"),
              r.toString(2).padStart(8, "0"),
            ],
            ["Hex", a.toString(16), b.toString(16), r.toString(16)],
          ],
          { Result: r },
        ),
      ];
    },
  },
  cs_boolean_algebra: {
    assumptions:
      "Exhaustive truth tables over Boolean A and B. The final two columns demonstrate De Morgan’s law for the chosen operator.",
    columns: ["A", "B", "A op B", "NOT (A op B)", "De Morgan equivalent"],
    parameters: [choice("op", "Operator", ["AND", "OR"])],
    run: (p) =>
      Array.from({ length: 4 }, (_, i) => {
        const rows = Array.from({ length: i + 1 }, (_, j) => {
          const a = Boolean(j & 2),
            b = Boolean(j & 1),
            r = p.op === "AND" ? a && b : a || b,
            e = p.op === "AND" ? !a || !b : !a && !b;
          return [Number(a), Number(b), Number(r), Number(!r), Number(e)];
        });
        return frame(
          `Evaluate truth-table row ${i + 1}. Both negated expressions agree.`,
          rows,
        );
      }),
  },
  cs_text_encoding: {
    assumptions:
      "Unicode scalar values encoded with UTF-8. Up to 24 characters; a displayed character may contain multiple code points.",
    columns: ["Character", "Code point", "UTF-8 bytes (hex)", "Byte count"],
    parameters: [input("text", "Text", "Hello π 🌍")],
    run: (p) => {
      const rows = [...String(p.text)].slice(0, 24).map((c) => {
        const bytes = new TextEncoder().encode(c);
        return [
          c,
          `U+${c.codePointAt(0)!.toString(16).toUpperCase()}`,
          [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(" "),
          bytes.length,
        ];
      });
      return rows.length
        ? rows.map((_, i) =>
            frame(
              `Encode code point ${i + 1}. UTF-8 uses 1–4 bytes per scalar value.`,
              rows.slice(0, i + 1),
              {
                Bytes: rows
                  .slice(0, i + 1)
                  .reduce((s, r) => s + Number(r[3]), 0),
              },
            ),
          )
        : [frame("Empty text has zero UTF-8 bytes.", [], { Bytes: 0 })];
    },
  },
  cs_variables_memory: {
    assumptions:
      "Two independent 32-bit signed integers, shown in little-endian byte order at illustrative addresses. Copying a primitive does not alias its storage.",
    columns: ["Variable", "Address", "Value", "Bytes (hex)"],
    parameters: [num("value", "Initial value", 42, -1000, 1000)],
    run: (p) => {
      const bytes = (v: number) => {
        const a = new ArrayBuffer(4);
        new DataView(a).setInt32(0, v, true);
        return [...new Uint8Array(a)]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");
      };
      const v = Number(p.value);
      return [
        frame("Allocate x.", [["x", "0x1000", v, bytes(v)]]),
        frame("Copy x into y in a different memory location.", [
          ["x", "0x1000", v, bytes(v)],
          ["y", "0x1004", v, bytes(v)],
        ]),
        frame("Increment x. y keeps its copied value.", [
          ["x", "0x1000", v + 1, bytes(v + 1)],
          ["y", "0x1004", v, bytes(v)],
        ]),
      ];
    },
  },
  cs_control_flow: {
    assumptions: "Execute: sum = 0; for i = 1..n, add i only when i is even.",
    columns: ["Variable", "Value"],
    parameters: [num("n", "Loop limit", 8, 1, 20)],
    run: (p) => {
      let sum = 0;
      const out = [frame("Initialize sum = 0.", [["sum", 0]])];
      for (let i = 1; i <= Number(p.n); i++) {
        out.push(
          frame(`Test i=${i}: i % 2 === 0 is ${i % 2 === 0}.`, [
            ["i", i],
            ["sum", sum],
          ]),
        );
        if (i % 2 === 0) {
          sum += i;
          out.push(
            frame(`Take the even branch: add ${i}.`, [
              ["i", i],
              ["sum", sum],
            ]),
          );
        }
      }
      out.push(
        frame("Loop condition is false; execution ends.", [["sum", sum]], {
          Result: sum,
        }),
      );
      return out;
    },
  },
  cs_stacks_queues: collection,
  cs_abstract_data_types: collection,
  cs_arrays: {
    assumptions:
      "Append-only dynamic array. Capacity doubles when full; a resize copies every existing element. Counts measure writes including copies.",
    columns: ["Index", "Value"],
    parameters: [num("n", "Append count", 9, 1, 16)],
    run: (p) => {
      let capacity = 2,
        writes = 0;
      const a: number[] = [],
        out: Frame[] = [
          frame("Allocate capacity for two values.", [], {
            Capacity: 2,
            Writes: 0,
          }),
        ];
      for (let i = 0; i < Number(p.n); i++) {
        if (a.length === capacity) {
          capacity *= 2;
          writes += a.length;
          out.push(
            frame(
              `Full: allocate ${capacity} slots and copy ${a.length} values.`,
              a.map((v, i) => [i, v]),
              { Capacity: capacity, Writes: writes },
            ),
          );
        }
        a.push(i + 1);
        writes++;
        out.push(
          frame(
            `Append ${i + 1} at index ${i}.`,
            a.map((v, i) => [i, v]),
            { Capacity: capacity, Writes: writes },
          ),
        );
      }
      return out;
    },
  },
  cs_linked_lists: {
    assumptions:
      "Singly linked list with explicit next pointers. Search follows pointers from the head; it cannot jump directly to an index.",
    columns: ["Node", "Value", "Next", "Cursor"],
    parameters: [num("target", "Search value", 30, 10, 50, 10)],
    run: (p) => {
      const vals = [10, 20, 30, 40, 50],
        out: Frame[] = [];
      for (let i = 0; i < vals.length; i++) {
        out.push(
          frame(
            vals[i] === Number(p.target)
              ? `Found ${p.target} after ${i + 1} node visits.`
              : `Visit node ${i}; follow its next pointer.`,
            vals.map((v, j) => [
              `N${j}`,
              v,
              j === 4 ? "null" : `N${j + 1}`,
              j === i ? "← current" : "",
            ]),
            { Visits: i + 1 },
          ),
        );
        if (vals[i] === Number(p.target)) break;
      }
      return out;
    },
  },
  cs_hash_tables: {
    assumptions:
      "Integer keys, h(k)=k mod bucket count. Separate chaining retains colliding keys; repeated keys are ignored.",
    columns: ["Bucket", "Keys"],
    parameters: [
      num("buckets", "Bucket count", 4, 2, 10),
      input("keys", "Keys", "5, 9, 13, 2, 6"),
    ],
    run: (p) => {
      const buckets: number[][] = Array.from(
          { length: Number(p.buckets) },
          () => [],
        ),
        out: Frame[] = [];
      let collisions = 0,
        size = 0;
      out.push(
        frame(
          "Begin with empty buckets.",
          buckets.map((b, i) => [i, b.join(" → ")]),
        ),
      );
      for (const k of String(p.keys)
        .split(",")
        .slice(0, 16)
        .map(Number)
        .filter(Number.isSafeInteger)) {
        const h = ((k % buckets.length) + buckets.length) % buckets.length;
        if (buckets[h].includes(k)) {
          out.push(
            frame(
              `Key ${k} already exists.`,
              buckets.map((b, i) => [i, b.join(" → ")]),
            ),
          );
          continue;
        }
        if (buckets[h].length) collisions++;
        buckets[h].push(k);
        size++;
        out.push(
          frame(
            `h(${k})=${h}; ${buckets[h].length > 1 ? "append to the collision chain" : "occupy this bucket"}.`,
            buckets.map((b, i) => [i, b.join(" → ")]),
            {
              Collisions: collisions,
              "Load factor": Number((size / buckets.length).toFixed(2)),
            },
          ),
        );
      }
      return out;
    },
  },
  cs_union_find: {
    assumptions:
      "Six elements. Union attaches the first root to the second; optional path compression rewrites parents during find.",
    columns: ["Element", "Parent"],
    parameters: [choice("compression", "Path compression", ["On", "Off"])],
    run: (p) => {
      const parent = [0, 1, 2, 3, 4, 5],
        out: Frame[] = [];
      const record = (s: string) =>
        out.push(
          frame(
            s,
            parent.map((v, i) => [i, v]),
          ),
        );
      record("Each element is its own set.");
      const find = (x: number): number => {
        if (parent[x] === x) return x;
        const root = find(parent[x]);
        if (p.compression === "On") parent[x] = root;
        return root;
      };
      for (const [a, b] of [
        [0, 1],
        [1, 2],
        [2, 3],
        [4, 5],
      ]) {
        parent[find(a)] = find(b);
        record(`Union(${a}, ${b}): connect their roots.`);
      }
      const root = find(0);
      record(
        `Find(0) returns root ${root}.${p.compression === "On" ? " Rewrite visited parent pointers to the root." : ""}`,
      );
      return out;
    },
  },
};
