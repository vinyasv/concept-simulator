import { Lesson, Frame, num, input, frame, round, seededRandom } from "./model";
export const learningLessons: Record<string, Lesson> = {
  cs_gradient_descent: {
    assumptions:
      "Minimize f(x)=(x−3)² using x ← x−η·2(x−3). For this quadratic, 0<η<1 converges, η=1 oscillates, and η>1 diverges. Stop if |x| exceeds 10⁶.",
    columns: ["Iteration", "x", "Loss", "Gradient"],
    parameters: [
      num("rate", "Learning rate η", 0.2, 0.05, 1.2, 0.05),
      num("x", "Initial x", -4, -8, 8),
    ],
    run: (p) => {
      let x = Number(p.x);
      const rows: Frame["rows"] = [],
        out: Frame[] = [];
      for (let i = 0; i <= 24; i++) {
        rows.push([i, round(x), round((x - 3) ** 2), round(2 * (x - 3))]);
        out.push({
          ...frame(
            i === 0
              ? "Start at the selected x."
              : `Subtract learning rate × previous gradient. ${Number(p.rate) >= 1 ? "This rate does not converge for this quadratic." : "The update moves toward the minimum at x=3."}`,
            [...rows],
            { x: round(x), Loss: round((x - 3) ** 2) },
          ),
          values: rows.map((r) => Number(r[2])),
        });
        if (Math.abs(x) > 1e6) break;
        x -= Number(p.rate) * 2 * (x - 3);
      }
      return out;
    },
  },
  cs_backpropagation: {
    assumptions:
      "One linear neuron ŷ=w·x, no bias. Train on x=2,target=6 with loss ½(ŷ−6)²; chain rule gives dL/dw=(ŷ−6)·2. This isolates the backpropagation step.",
    columns: ["Quantity", "Value"],
    parameters: [
      num("rate", "Learning rate", 0.1, 0.01, 0.45, 0.01),
      num("weight", "Initial weight", 0, -3, 6),
    ],
    run: (p) => {
      let w = Number(p.weight);
      const out: Frame[] = [];
      for (let i = 0; i < 12; i++) {
        const y = w * 2,
          error = y - 6,
          gradient = error * 2;
        out.push(
          frame(
            `Iteration ${i}: forward pass computes the prediction.`,
            [
              ["w", round(w)],
              ["ŷ = w × 2", round(y)],
              ["Loss", round((error * error) / 2)],
            ],
            { Iteration: i, Loss: round((error * error) / 2) },
          ),
        );
        out.push(
          frame("Backward pass: dL/dw = dL/dŷ × dŷ/dw = error × input.", [
            ["dL/dŷ", round(error)],
            ["dŷ/dw", 2],
            ["dL/dw", round(gradient)],
          ]),
        );
        w -= Number(p.rate) * gradient;
        out.push(
          frame(
            "Apply w ← w − learning rate × gradient.",
            [["Updated weight", round(w)]],
            { Weight: round(w) },
          ),
        );
      }
      return out;
    },
  },
  cs_decision_trees: {
    assumptions:
      "One decision stump over eight labeled samples. Split rule is x ≤ threshold; quality is reduction in binary entropy. This does not grow a complete tree.",
    columns: ["x", "Class", "Branch"],
    parameters: [num("threshold", "Split threshold", 4.5, 1.5, 7.5, 1)],
    run: (p) => {
      const data = [0, 0, 0, 1, 0, 1, 1, 1],
        entropy = (a: number[]) => {
          if (!a.length) return 0;
          const f = a.reduce((s, v) => s + v, 0) / a.length;
          return f === 0 || f === 1
            ? 0
            : -f * Math.log2(f) - (1 - f) * Math.log2(1 - f);
        },
        left = data.filter((_, i) => i + 1 <= Number(p.threshold)),
        right = data.filter((_, i) => i + 1 > Number(p.threshold)),
        gain =
          entropy(data) -
          (left.length * entropy(left) + right.length * entropy(right)) /
            data.length;
      return [
        frame(
          "Before splitting, both classes are mixed.",
          data.map((c, i) => [i + 1, c, "Root"]),
          { Entropy: round(entropy(data)) },
        ),
        frame(
          `Partition at x ≤ ${p.threshold}. Weight each child’s entropy by its sample count.`,
          data.map((c, i) => [
            i + 1,
            c,
            i + 1 <= Number(p.threshold) ? "Left" : "Right",
          ]),
          {
            "Information gain": round(gain),
            "Left entropy": round(entropy(left)),
            "Right entropy": round(entropy(right)),
          },
        ),
      ];
    },
  },
  cs_reinforcement_learning: {
    assumptions:
      "Seeded Q-learning in a five-cell line. Start at 0, goal at 4; goal reward +1, other moves −0.02. α=0.5, γ=0.9. Terminal states do not bootstrap; episodes stop after 30 moves.",
    columns: ["Cell", "Q(left)", "Q(right)", "Greedy action"],
    parameters: [
      num("epsilon", "Exploration probability", 0.2, 0, 1, 0.1),
      num("seed", "Random seed", 7, 1, 100),
    ],
    run: (p) => {
      const q = Array.from({ length: 5 }, () => [0, 0]),
        random = seededRandom(Number(p.seed)),
        out: Frame[] = [];
      for (let episode = 0; episode < 12; episode++) {
        let s = 0;
        for (let t = 0; t < 30; t++) {
          const action =
              random() < Number(p.epsilon)
                ? Math.floor(random() * 2)
                : q[s][1] >= q[s][0]
                  ? 1
                  : 0,
            next = Math.max(0, Math.min(4, s + (action ? 1 : -1))),
            reward = next === 4 ? 1 : -0.02,
            target = reward + (next === 4 ? 0 : 0.9 * Math.max(...q[next]));
          q[s][action] += 0.5 * (target - q[s][action]);
          out.push(
            frame(
              `Episode ${episode + 1}: ${s} → ${next}, reward ${reward}. Update only Q(${s},${action ? "right" : "left"}).`,
              q.map((a, i) => [
                i,
                round(a[0]),
                round(a[1]),
                i === 4 ? "Goal" : a[1] >= a[0] ? "Right" : "Left",
              ]),
              { Episode: episode + 1, Cell: next },
            ),
          );
          s = next;
          if (s === 4) break;
        }
      }
      return out;
    },
  },
  cs_automata_languages: {
    assumptions:
      "DFA over {0,1} accepts exactly strings containing an even number of 1s, including the empty string. q0 is accepting; reading 1 toggles state.",
    columns: ["Consumed prefix", "State", "Accepting if stopped"],
    parameters: [input("word", "Binary string", "1011")],
    run: (p) => {
      const word = String(p.word).slice(0, 32);
      if (/[^01]/.test(word))
        return [
          frame("Input must contain only 0 and 1.", [
            ["Invalid input", word, "—"],
          ]),
        ];
      let state = 0;
      const out = [frame("Begin in accepting state q0.", [["ε", "q0", "Yes"]])];
      [...word].forEach((c, i) => {
        if (c === "1") state = 1 - state;
        out.push(
          frame(
            `Read ${c}: ${c === "1" ? "toggle state" : "keep the state"}.`,
            [[word.slice(0, i + 1), `q${state}`, state ? "No" : "Yes"]],
          ),
        );
      });
      out.push(
        frame(
          state ? "Reject: odd number of 1s." : "Accept: even number of 1s.",
          [[word || "ε", `q${state}`, state ? "No" : "Yes"]],
          { Result: state ? "Rejected" : "Accepted" },
        ),
      );
      return out;
    },
  },
  cs_compiler_pipeline: {
    assumptions:
      "Small arithmetic language: three nonnegative integers in a + b * c form, each ≤99. Multiplication has higher precedence. Constant folding is legal because there are no side effects.",
    columns: ["Stage", "Representation"],
    parameters: [input("source", "Expression", "2 + 3 * 4")],
    run: (p) => {
      const source = String(p.source).trim(),
        m = source.match(/^(\d{1,2})\s*\+\s*(\d{1,2})\s*\*\s*(\d{1,2})$/);
      if (!m)
        return [
          frame("Expected a + b * c with integers from 0 to 99.", [
            ["Parse error", source],
          ]),
        ];
      const [a, b, c] = m.slice(1).map(Number);
      return [
        frame("Lexing converts characters to tokens.", [
          ["Tokens", `${a}  +  ${b}  *  ${c}`],
        ]),
        frame(
          "Parsing respects precedence: multiplication is nested under addition.",
          [["AST", `Add(${a}, Multiply(${b}, ${c}))`]],
        ),
        frame("Constant folding evaluates the constant subtree.", [
          ["Optimized AST", `Add(${a}, ${b * c})`],
        ]),
        frame(
          "Fold the remaining constant expression and emit an instruction.",
          [["Bytecode", `PUSH ${a + b * c}`]],
          { Result: a + b * c },
        ),
      ];
    },
  },
  cs_computability_complexity: {
    assumptions:
      "Exhaustive subset-sum search over values 1..n, testing 2^n subsets. Checking a candidate takes at most n additions. This illustrates search versus verification, not a proof about P versus NP or a solution to undecidability.",
    columns: ["Subset mask", "Chosen values", "Sum", "Matches"],
    parameters: [
      num("n", "Set size", 5, 2, 8),
      num("target", "Target sum", 9, 0, 40),
    ],
    run: (p) => {
      const n = Number(p.n),
        out: Frame[] = [];
      for (let mask = 0; mask < 2 ** n; mask++) {
        const chosen = Array.from({ length: n }, (_, i) => i + 1).filter(
            (_, i) => mask & (1 << i),
          ),
          sum = chosen.reduce((s, v) => s + v, 0);
        out.push(
          frame(
            `Test candidate ${mask + 1} of ${2 ** n}.${sum === Number(p.target) ? " This subset is a witness." : ""}`,
            [
              [
                mask.toString(2).padStart(n, "0"),
                chosen.join(", ") || "∅",
                sum,
                sum === Number(p.target) ? "Yes" : "No",
              ],
            ],
            { "Candidates checked": mask + 1, "Search space": 2 ** n },
          ),
        );
      }
      return out;
    },
  },
};
