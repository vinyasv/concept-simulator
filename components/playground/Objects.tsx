import React from "react";
import { Stat } from "../SimSDK";
import {
  bitResult,
  byteBits,
  collectionAction,
  CollectionKind,
  newCollection,
  hashInsert,
  newCache,
  accessCache,
} from "../../simulations/playground";
import { Choices, Feedback, useMaterial, Workbench } from "./shared";

export function BitTray() {
  const model = useMaterial({
    a: 5,
    b: 3,
    op: "AND",
    message:
      "Each tile is a power of two. Flip one to include or remove its value.",
  });
  const s = model.state,
    result = bitResult(s.a, s.b, s.op);
  return (
    <Workbench
      id="bits"
      model={model}
      assumptions="Unsigned eight-bit integers. NOT and shifts wrap to eight bits; right shift fills with zero. The second operand is unused for unary operations."
      readings={
        <>
          <Stat label="A" value={s.a} />
          <Stat label="B" value={s.b} />
          <Stat label="Result" value={result} />
        </>
      }
    >
      <Choices
        label="Bit operation"
        values={["AND", "OR", "XOR", "NOT A", "A << 1", "A >> 1"]}
        value={s.op}
        onChange={(op) =>
          model.change({ ...s, op, message: `Comparing the bits with ${op}.` })
        }
      />
      <div className="play-bit-tray">
        {(["a", "b"] as const).map((key) => (
          <div className="play-bit-row" key={key}>
            <strong>{key.toUpperCase()}</strong>
            {byteBits(s[key])
              .split("")
              .map((bit, i) => (
                <button
                  className={bit === "1" ? "is-on" : ""}
                  key={i}
                  aria-label={`Toggle ${key.toUpperCase()} bit ${7 - i}, value ${2 ** (7 - i)}`}
                  aria-pressed={bit === "1"}
                  onClick={() =>
                    model.change({
                      ...s,
                      [key]: s[key] ^ (1 << (7 - i)),
                      message: `${key.toUpperCase()}: ${s[key]} → ${s[key] ^ (1 << (7 - i))}. Bit ${7 - i} contributes ${2 ** (7 - i)}.`,
                    })
                  }
                >
                  <small>{2 ** (7 - i)}</small>
                  <b>{bit}</b>
                </button>
              ))}
            <output>{s[key]}</output>
          </div>
        ))}
        <div className="play-bit-row play-bit-result">
          <strong>=</strong>
          {byteBits(result)
            .split("")
            .map((bit, i) => (
              <div key={i} className={bit === "1" ? "is-on" : ""}>
                <small>{2 ** (7 - i)}</small>
                <b>{bit}</b>
              </div>
            ))}
          <output>{result}</output>
        </div>
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
const gate = (op: string, a: boolean, b: boolean) =>
  op === "AND" ? a && b : op === "OR" ? a || b : a !== b;
export function LogicBench() {
  const model = useMaterial({
    a: true,
    b: false,
    c: true,
    first: "AND",
    second: "OR",
    connected: true,
    message: "Toggle an input or disconnect the wire between the gates.",
  });
  const s = model.state,
    mid = gate(s.first, s.a, s.b),
    result = gate(s.second, s.connected && mid, s.c);
  const toggle = (key: "a" | "b" | "c") =>
    model.change({
      ...s,
      [key]: !s[key],
      message: `Input ${key.toUpperCase()} is now ${Number(!s[key])}. Follow the signal to the output.`,
    });
  return (
    <Workbench
      id="gates"
      model={model}
      assumptions="Two ideal combinational gates. An unplugged gate input is held low (0), rather than floating. There is no propagation delay."
      readings={<Stat label="Output" value={Number(result)} />}
    >
      <div className="play-circuit">
        <div className="play-input-pair">
          {(["a", "b"] as const).map((key) => (
            <button
              className={`play-switch ${s[key] ? "is-on" : ""}`}
              key={key}
              aria-pressed={s[key]}
              onClick={() => toggle(key)}
            >
              {key.toUpperCase()}
              <b>{Number(s[key])}</b>
            </button>
          ))}
        </div>
        <div className="play-gate">
          <Choices
            label="First gate"
            values={["AND", "OR", "XOR"]}
            value={s.first}
            onChange={(first) =>
              model.change({
                ...s,
                first,
                message: `The first gate now computes ${first}.`,
              })
            }
          />
          <output>{Number(mid)}</output>
        </div>
        <button
          className={`play-wire ${s.connected && mid ? "is-on" : ""}`}
          aria-pressed={s.connected}
          aria-label="Connect wire between gates"
          onClick={() =>
            model.change({
              ...s,
              connected: !s.connected,
              message: s.connected
                ? "Wire disconnected; the second gate receives 0 here."
                : "Wire connected; the first gate drives the second.",
            })
          }
        >
          {s.connected ? "──→" : "─  ─"}
          <small>{s.connected ? "Connected" : "Connect"}</small>
        </button>
        <div className="play-gate">
          <Choices
            label="Second gate"
            values={["AND", "OR", "XOR"]}
            value={s.second}
            onChange={(second) =>
              model.change({
                ...s,
                second,
                message: `The second gate now computes ${second}.`,
              })
            }
          />
          <button
            className={`play-switch ${s.c ? "is-on" : ""}`}
            aria-pressed={s.c}
            onClick={() => toggle("c")}
          >
            C <b>{Number(s.c)}</b>
          </button>
        </div>
        <div
          className={`play-lamp ${result ? "is-on" : ""}`}
          aria-label={`Output ${Number(result)}`}
        >
          {Number(result)}
          <small>Output</small>
        </div>
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function EncodingBench() {
  const model = useMaterial({ text: "Hi π🌍", selected: 0 });
  const s = model.state,
    chars = Array.from(s.text),
    selected = chars[Math.min(s.selected, chars.length - 1)],
    bytes = selected ? Array.from(new TextEncoder().encode(selected)) : [];
  return (
    <Workbench
      id="encoding"
      model={model}
      assumptions="Each tile represents one Unicode code point, which may be only part of a displayed grapheme. UTF-8 uses one to four bytes per code point. Combining characters are separate tiles."
      readings={
        <>
          <Stat label="Code points" value={chars.length} />
          <Stat
            label="UTF-8 bytes"
            value={new TextEncoder().encode(s.text).length}
          />
        </>
      }
    >
      <label className="play-text-input">
        Your message{" "}
        <input
          value={s.text}
          maxLength={24}
          onChange={(e) => model.change({ text: e.target.value, selected: 0 })}
        />
      </label>
      <div className="play-actions" aria-label="Add a character">
        {["A", "é", "π", "🌍", "́"].map((char) => (
          <button
            key={char}
            aria-label={`Append ${char === "́" ? "combining acute accent" : char}`}
            onClick={() =>
              model.change({
                text: Array.from(s.text + char)
                  .slice(0, 12)
                  .join(""),
                selected: Math.min(chars.length, 11),
              })
            }
          >
            + {char === "́" ? "◌́" : char}
          </button>
        ))}
      </div>
      <div className="play-objects">
        {chars.map((char, i) => (
          <button
            className={`play-tile ${s.selected === i ? "is-selected" : ""}`}
            key={i}
            onClick={() => model.change({ ...s, selected: i })}
            aria-label={`Inspect code point ${i}: ${char}`}
          >
            <b>{char === " " ? "␣" : char}</b>
            <small>U+{char.codePointAt(0)!.toString(16).toUpperCase()}</small>
          </button>
        ))}
      </div>
      <div className="play-byte-detail">
        {bytes.map((byte, i) => (
          <div key={i}>
            <b>{byteBits(byte)}</b>
            <small>
              {byte} · 0x{byte.toString(16).padStart(2, "0")}
            </small>
          </div>
        ))}
      </div>
      <Feedback>
        {selected
          ? `“${selected}” occupies ${bytes.length} byte${bytes.length === 1 ? "" : "s"}. Try comparing A with 🌍.`
          : "Add a character to open its bytes."}
      </Feedback>
    </Workbench>
  );
}
export function CollectionBench() {
  const model = useMaterial({
    ...newCollection(),
    kind: "Stack" as CollectionKind,
    input: 7,
  });
  const s = model.state;
  const act = (action: "add" | "remove", value: number) =>
    model.change({ ...s, ...collectionAction(s, s.kind, action, value) });
  return (
    <Workbench
      id="collections"
      model={model}
      assumptions="At most 12 integer objects. Arrays double capacity when full; cost counts writes and copied elements. Linked-list pointer changes are illustrated without allocator costs. Changing structure keeps values except duplicate removal for sets."
      readings={
        <>
          <Stat label="Size" value={s.items.length} />
          {s.kind === "Array" && <Stat label="Capacity" value={s.capacity} />}
          <Stat label="Last operation writes" value={s.cost} />
        </>
      }
    >
      <Choices
        label="Data structure"
        values={["Stack", "Queue", "Set", "Array", "Linked list"] as const}
        value={s.kind}
        onChange={(kind) =>
          model.change({
            ...s,
            kind,
            items: kind === "Set" ? [...new Set(s.items)] : s.items,
            message: `Now a ${kind.toLowerCase()}.${kind === "Set" ? " Duplicate values were combined." : " The objects are preserved."}`,
          })
        }
      />
      <div className="play-actions">
        <label>
          Value{" "}
          <input
            aria-label="Value to add"
            type="number"
            min={0}
            max={99}
            value={s.input}
            onChange={(e) =>
              model.change({
                ...s,
                input: Math.max(0, Math.min(99, Number(e.target.value))),
              })
            }
          />
        </label>
        <button className="play-primary" onClick={() => act("add", s.input)}>
          {s.kind === "Stack" ? "Push" : s.kind === "Queue" ? "Enqueue" : "Add"}{" "}
          {s.input}
        </button>
        {["Stack", "Queue"].includes(s.kind) && (
          <button onClick={() => act("remove", 0)}>
            {s.kind === "Stack" ? "Pop" : "Dequeue"}
          </button>
        )}
      </div>
      <div
        className={`play-objects play-collection ${s.kind === "Stack" ? "play-stack" : ""}`}
        aria-label={`${s.kind} contents`}
      >
        {s.items.map((item, i) => (
          <React.Fragment key={i}>
            <button
              className="play-tile"
              aria-label={`Item ${item} at index ${i}${!["Stack", "Queue"].includes(s.kind) ? "; remove" : ""}`}
              onClick={() =>
                ["Stack", "Queue"].includes(s.kind)
                  ? model.change({
                      ...s,
                      message:
                        s.kind === "Stack"
                          ? `${item} is ${i === s.items.length - 1 ? "at the top: Pop removes it" : "below the top: Pop removes the newest item first"}.`
                          : `${item} is ${i === 0 ? "at the front: Dequeue removes it" : "waiting behind earlier arrivals"}.`,
                    })
                  : act("remove", i)
              }
            >
              <small>
                {s.kind === "Array"
                  ? `[${i}]`
                  : s.kind === "Queue"
                    ? i === 0
                      ? "Front"
                      : i === s.items.length - 1
                        ? "Back"
                        : ""
                    : s.kind === "Stack" && i === s.items.length - 1
                      ? "Top"
                      : `#${i}`}
              </small>
              <b>{item}</b>
            </button>
            {s.kind === "Linked list" && (
              <span className="play-arrow">
                {i === s.items.length - 1 ? "→ ∅" : "→"}
              </span>
            )}
          </React.Fragment>
        ))}
        {!s.items.length && (
          <p className="play-empty">
            An empty {s.kind.toLowerCase()}. Add your first object.
          </p>
        )}
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function MemoryBench() {
  const model = useMaterial({
    objects: [4, 4],
    refs: [0, 1],
    message:
      "A and B start with separate objects. Make B share A, then mutate one.",
  });
  const s = model.state;
  return (
    <Workbench
      id="memory"
      model={model}
      assumptions="A small reference model: names point to mutable one-field objects. Copy allocates a distinct object; sharing copies the reference. Object identifiers are illustrative, not machine addresses."
    >
      <div className="play-memory-names">
        {s.refs.map((ref, i) => (
          <div key={i}>
            <strong>Name {"AB"[i]}</strong>
            <span className="play-arrow">↓ object {ref}</span>
            <button
              className="play-tile"
              aria-label={`Increment through ${"AB"[i]}`}
              onClick={() =>
                model.change({
                  ...s,
                  objects: s.objects.map((n, j) => (j === ref ? n + 1 : n)),
                  message: `Changed object ${ref} through ${"AB"[i]}.${s.refs[0] === s.refs[1] ? " Both names see the same change." : " The other object is unchanged."}`,
                })
              }
            >
              <b>{s.objects[ref]}</b>
              <small>Click to add 1</small>
            </button>
          </div>
        ))}
      </div>
      <div className="play-actions">
        <button
          onClick={() =>
            model.change({
              ...s,
              refs: [s.refs[0], s.refs[0]],
              message:
                "B now points to A's object. There is one shared object, not two copies.",
            })
          }
        >
          B shares A
        </button>
        <button
          onClick={() =>
            model.change({
              objects: [s.objects[s.refs[0]], s.objects[s.refs[0]]],
              refs: [0, 1],
              message:
                "B now has its own copy. Change either value to see the difference.",
            })
          }
        >
          B copies A's value
        </button>
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function HashBench() {
  const model = useMaterial({
    buckets: [[5], [], [2, 7], [], []] as number[][],
    value: 12,
    selected: -1,
    message: "2 and 7 share a bucket. Can you add a third key to that chain?",
  });
  const s = model.state;
  return (
    <Workbench
      id="hash"
      model={model}
      assumptions="Five buckets, integer key modulo five, separate chaining, unique keys. Click stored keys to delete them. Bucket count is fixed to isolate collisions."
      readings={
        <Stat
          label="Load factor"
          value={(s.buckets.flat().length / 5).toFixed(1)}
        />
      }
    >
      <div className="play-actions">
        <label>
          Key{" "}
          <input
            type="number"
            aria-label="Key to insert"
            min={0}
            max={99}
            value={s.value}
            onChange={(e) =>
              model.change({
                ...s,
                value: Math.max(0, Math.min(99, Number(e.target.value))),
              })
            }
          />
        </label>
        <button
          className="play-primary"
          onClick={() =>
            model.change(
              s.buckets.flat().length >= 15
                ? {
                    ...s,
                    message:
                      "This bench holds 15 keys. Delete a key to make room.",
                  }
                : {
                    ...s,
                    buckets: hashInsert(s.buckets, s.value),
                    selected: s.value % 5,
                    message: s.buckets.flat().includes(s.value)
                      ? `${s.value} already exists.`
                      : `${s.value} mod 5 = ${s.value % 5}.${s.buckets[s.value % 5].length ? " A collision: append to this bucket's chain." : " An empty bucket."}`,
                  },
            )
          }
        >
          Insert key
        </button>
      </div>
      <div className="play-buckets">
        {s.buckets.map((bucket, i) => (
          <div key={i} className={s.selected === i ? "is-selected" : ""}>
            <small>Bucket {i}</small>
            {bucket.map((value) => (
              <button
                key={value}
                className="play-tile"
                aria-label={`Delete key ${value}`}
                onClick={() =>
                  model.change({
                    ...s,
                    buckets: s.buckets.map((b) => b.filter((n) => n !== value)),
                    selected: i,
                    message: `Deleted ${value} from bucket ${i}; the other chain entries remain.`,
                  })
                }
              >
                {value}
              </button>
            ))}
            {!bucket.length && <span className="play-empty">∅</span>}
          </div>
        ))}
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function CacheBench() {
  const model = useMaterial(newCache()),
    s = model.state;
  return (
    <Workbench
      id="cache"
      model={model}
      assumptions="One fully associative three-entry cache, one address per entry, least-recently-used eviction. Accesses are synchronous. No multilevel hierarchy, dirty writes, or hardware timing."
      readings={
        <>
          <Stat label="Hits" value={s.hits} />
          <Stat label="Misses" value={s.misses} />
        </>
      }
    >
      <div className="play-cache">
        <small>Cache · least recent → most recent</small>
        <div className="play-objects">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              className={`play-tile ${s.slots[i] === s.last ? "is-selected" : ""}`}
              key={i}
            >
              <b>{s.slots[i] ?? "—"}</b>
              <small>
                {s.slots[i] === undefined ? "Empty" : "Cached address"}
              </small>
            </div>
          ))}
        </div>
      </div>
      <div>
        <small>Main memory · touch an address</small>
        <div className="play-objects">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              className={`play-tile ${s.last === i ? "is-selected" : ""}`}
              key={i}
              aria-label={`Read address ${i}`}
              onClick={() => model.change(accessCache(s, i, 3))}
            >
              <small>Address</small>
              <b>{i}</b>
            </button>
          ))}
        </div>
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
