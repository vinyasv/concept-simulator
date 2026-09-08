import React from "react";
import { Stat } from "../SimSDK";
import { modPow } from "../../simulations/model";
import { Choices, Feedback, useMaterial, Workbench } from "./shared";

export function joinRows(people: number[], pets: number[], left: boolean) {
  return people.flatMap((key, i) => {
    const matches = pets.flatMap((owner, j) =>
      owner === key ? [{ person: i, pet: j }] : [],
    );
    return matches.length ? matches : left ? [{ person: i, pet: -1 }] : [];
  });
}
export function JoinBench() {
  const model = useMaterial({
    people: [1, 2, 3],
    pets: [1, 1, 4],
    mode: "Inner" as "Inner" | "Left",
    selected: "",
    message:
      "Change a pet's owner key. Watch which people gain or lose a matching row.",
  });
  const s = model.state,
    rows = joinRows(s.people, s.pets, s.mode === "Left"),
    names = ["Ari", "Bo", "Cy"],
    pets = ["Cat", "Dog", "Bird"];
  return (
    <Workbench
      id="joins"
      model={model}
      assumptions="Three people with fixed unique keys and three pets with editable owner keys. The result is people JOIN pets ON person.id = pet.owner. Inner joins omit unmatched people; left joins keep them with NULL pet values."
      readings={<Stat label="Result rows" value={rows.length} />}
    >
      <Choices
        label="Join type"
        values={["Inner", "Left"] as const}
        value={s.mode}
        onChange={(mode) =>
          model.change({
            ...s,
            mode,
            message:
              mode === "Left"
                ? "Unmatched people now remain in the result with NULL pets."
                : "Only matching people and pets appear.",
          })
        }
      />
      <div className="play-join-scene">
        <div>
          <h3>People</h3>
          {names.map((name, i) => (
            <div className="play-record" key={name}>
              <strong>{name}</strong>
              <span>id {s.people[i]}</span>
            </div>
          ))}
        </div>
        <div>
          <h3>Pets · choose owner</h3>
          {pets.map((pet, i) => (
            <div className="play-record" key={pet}>
              <strong>{pet}</strong>
              <select
                aria-label={`${pet} owner key`}
                value={s.pets[i]}
                onChange={(e) => {
                  const owner = Number(e.target.value);
                  model.change({
                    ...s,
                    pets: s.pets.map((key, j) => (i === j ? owner : key)),
                    message: `${pet}'s owner key is ${owner}.${owner === 4 ? " No person has that key." : ` It matches ${names[owner - 1]}.`}`,
                  });
                }}
              >
                {[1, 2, 3, 4].map((key) => (
                  <option key={key} value={key}>
                    {key}
                    {key === 4 ? " (no person)" : ` · ${names[key - 1]}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div>
          <h3>Joined pairs</h3>
          <div className="play-join-results">
            {rows.map((row, i) => (
              <div className="play-record is-match" key={i}>
                <span>{names[row.person]}</span>
                <span>↔</span>
                <strong>{row.pet < 0 ? "NULL" : pets[row.pet]}</strong>
              </div>
            ))}
            {!rows.length && <p className="play-empty">No matching pairs</p>}
          </div>
        </div>
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function feedMachine(
  transitions: number[][],
  current: number,
  bit: number,
) {
  return transitions[current][bit];
}
export function AutomatonBench() {
  const model = useMaterial({
    transitions: [
      [0, 1],
      [0, 1],
    ],
    accepting: [false, true],
    current: 0,
    word: "",
    message:
      "This machine accepts words ending in 1. Feed it a bit, or rewire a transition.",
  });
  const s = model.state;
  return (
    <Workbench
      id="automaton"
      model={model}
      assumptions="A deterministic two-state automaton over {0,1}. State q0 is the start. Each state has exactly one transition per symbol. You can edit transitions and accepting states; rewiring restarts the input word to avoid mixing machines."
      readings={
        <Stat
          label="Current word"
          value={s.accepting[s.current] ? "Accepted" : "Rejected"}
        />
      }
    >
      <div className="play-actions">
        <button
          className="play-primary"
          onClick={() =>
            model.change({
              ...s,
              current: feedMachine(s.transitions, s.current, 0),
              word: (s.word + "0").slice(-24),
              message: `Read 0: q${s.current} → q${feedMachine(s.transitions, s.current, 0)}.`,
            })
          }
        >
          Feed 0
        </button>
        <button
          className="play-primary"
          onClick={() =>
            model.change({
              ...s,
              current: feedMachine(s.transitions, s.current, 1),
              word: (s.word + "1").slice(-24),
              message: `Read 1: q${s.current} → q${feedMachine(s.transitions, s.current, 1)}.`,
            })
          }
        >
          Feed 1
        </button>
        <button
          onClick={() =>
            model.change({
              ...s,
              word: "",
              current: 0,
              message: "New word; returned to q0. Your machine is preserved.",
            })
          }
        >
          New word
        </button>
        <code>…{s.word || "ε"}</code>
      </div>
      <div className="play-automaton">
        {[0, 1].map((q) => (
          <div key={q} className="play-state">
            <button
              className={`play-node ${s.current === q ? "is-on" : ""} ${s.accepting[q] ? "is-accepting" : ""}`}
              aria-label={`Toggle accepting state q${q}`}
              aria-pressed={s.accepting[q]}
              onClick={() =>
                model.change({
                  ...s,
                  accepting: s.accepting.map((a, i) => (q === i ? !a : a)),
                  message: `q${q} is now ${s.accepting[q] ? "not accepting" : "accepting"}.`,
                })
              }
            >
              q{q}
            </button>
            <small>
              {s.accepting[q]
                ? "Accepting · click to change"
                : "Rejecting · click to change"}
            </small>
            {[0, 1].map((bit) => (
              <label key={bit}>
                Read {bit} →{" "}
                <select
                  aria-label={`From q${q} on ${bit}`}
                  value={s.transitions[q][bit]}
                  onChange={(e) => {
                    const target = Number(e.target.value);
                    model.change({
                      ...s,
                      transitions: s.transitions.map((row, i) =>
                        i === q
                          ? row.map((n, j) => (j === bit ? target : n))
                          : row,
                      ),
                      current: 0,
                      word: "",
                      message: `Rewired q${q} on ${bit} to q${target}. Input restarted.`,
                    });
                  }}
                >
                  <option value={0}>q0</option>
                  <option value={1}>q1</option>
                </select>
              </label>
            ))}
          </div>
        ))}
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function CryptoBench() {
  const model = useMaterial({
    a: 6,
    b: 15,
    sentA: false,
    sentB: false,
    message:
      "Choose each private exponent, then send the public values across the channel.",
  });
  const s = model.state,
    A = modPow(5, s.a, 23),
    B = modPow(5, s.b, 23);
  return (
    <Workbench
      id="crypto"
      model={model}
      assumptions="Toy Diffie–Hellman using prime p=23 and generator g=5. Public values are g^private mod p; each side raises the received public value to its private exponent. Tiny keys are educational and insecure. This does not authenticate peers or model signatures."
    >
      <div className="play-key-exchange">
        {[0, 1].map((i) => (
          <div className="play-key-party" key={i}>
            <h3>{i === 0 ? "Alice" : "Bob"}</h3>
            <label>
              Private exponent{" "}
              <input
                type="number"
                min={1}
                max={22}
                aria-label={`${i === 0 ? "Alice" : "Bob"} private exponent`}
                value={i === 0 ? s.a : s.b}
                onChange={(e) =>
                  model.change({
                    ...s,
                    [i === 0 ? "a" : "b"]: Math.max(
                      1,
                      Math.min(22, Number(e.target.value)),
                    ),
                    sentA: false,
                    sentB: false,
                    message:
                      "New private exponent. Old messages cleared; exchange the new public values.",
                  })
                }
              />
            </label>
            <div className="play-tile">
              <small>Public value · 5^private mod 23</small>
              <b>{i === 0 ? A : B}</b>
            </div>
            <button
              onClick={() =>
                model.change({
                  ...s,
                  [i === 0 ? "sentA" : "sentB"]: true,
                  message: `${i === 0 ? "Alice" : "Bob"} sent ${i === 0 ? A : B}; the private exponent stayed local.`,
                })
              }
            >
              Send public value →
            </button>
            <div className="play-secret">
              <small>Derived shared key</small>
              <output>
                {(i === 0 ? s.sentB : s.sentA)
                  ? i === 0
                    ? modPow(B, s.a, 23)
                    : modPow(A, s.b, 23)
                  : "Waiting"}
              </output>
            </div>
          </div>
        ))}
        <div className="play-public-channel">
          <small>Visible on the public channel</small>
          <code>p = 23 · g = 5</code>
          <span>{s.sentA ? `Alice → ${A}` : "Alice has not sent"}</span>
          <span>{s.sentB ? `Bob → ${B}` : "Bob has not sent"}</span>
        </div>
      </div>
      <Feedback>
        {s.sentA && s.sentB
          ? `Both derived ${modPow(B, s.a, 23)} without sending that key. Change a private exponent and try again.`
          : s.message}
      </Feedback>
    </Workbench>
  );
}
