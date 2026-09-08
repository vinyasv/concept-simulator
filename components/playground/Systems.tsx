import React from "react";
import { Stat } from "../SimSDK";
import {
  newThreads,
  runThread,
  newDeadlock,
  requestResource,
  releaseResources,
  isDeadlocked,
  newNetwork,
  networkAction,
  newTransaction,
  transactionAction,
} from "../../simulations/playground";
import { Feedback, useMaterial, Workbench } from "./shared";

export function ThreadBench() {
  const model = useMaterial(newThreads()),
    s = model.state;
  return (
    <Workbench
      id="threads"
      model={model}
      assumptions="Two threads increment a shared integer once using read then write. You select the interleaving. The mutex covers both operations. Changing mutex mode restarts the two threads."
      readings={
        <>
          <Stat label="Shared counter" value={s.shared} />
          <Stat
            label="Completed threads"
            value={s.pc.filter((p) => p === 2).length}
          />
        </>
      }
    >
      <div className="play-actions">
        <button
          aria-pressed={s.lock}
          onClick={() => model.change(newThreads(!s.lock))}
        >
          {s.lock ? "Mutex on" : "Mutex off"} · toggle & restart
        </button>
      </div>
      <div className="play-thread-scene">
        {s.pc.map((pc, i) => (
          <div className="play-thread" key={i}>
            <h3>Thread {"AB"[i]}</h3>
            <code className={pc === 0 ? "is-current" : ""}>local = shared</code>
            <code className={pc === 1 ? "is-current" : ""}>
              shared = local + 1
            </code>
            <div className="play-local">
              Local <b>{s.local[i] ?? "—"}</b>
            </div>
            <button
              className="play-primary"
              onClick={() => model.change(runThread(s, i))}
            >
              {pc === 2
                ? `${"AB"[i]} finished`
                : s.lock && s.owner !== null && s.owner !== i
                  ? `${"AB"[i]} waits for mutex`
                  : `${"AB"[i]}: ${pc === 0 ? "read shared" : "write local + 1"}`}
            </button>
          </div>
        ))}
        <div className="play-shared">
          <small>Shared memory</small>
          <output>{s.shared}</output>
          <span>
            {s.owner === null ? "Mutex free" : `Mutex held by ${"AB"[s.owner]}`}
          </span>
        </div>
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function DeadlockBench() {
  const model = useMaterial(newDeadlock()),
    s = model.state;
  return (
    <Workbench
      id="deadlock"
      model={model}
      assumptions="Two processes and two exclusive resources. A waiting process cannot make another request. Release is a manual recovery action; this experiment does not imply real deadlocked programs automatically release resources."
      readings={
        <Stat label="Circular wait" value={isDeadlocked(s) ? "Yes" : "No"} />
      }
    >
      <div className="play-resource-scene">
        <div className="play-objects">
          {s.owners.map((owner, i) => (
            <div
              className={`play-tile ${owner !== null ? "is-selected" : ""}`}
              key={i}
            >
              <small>Resource</small>
              <b>{"AB"[i]}</b>
              <span>{owner === null ? "Free" : `Held by P${owner + 1}`}</span>
            </div>
          ))}
        </div>
        <div className="play-two-columns">
          {[0, 1].map((p) => (
            <div className="play-process" key={p}>
              <h3>Process {p + 1}</h3>
              <p>
                {s.waiting[p] === null
                  ? "Ready to request"
                  : `Waiting for ${"AB"[s.waiting[p]!]}`}
              </p>
              <div className="play-actions">
                {[0, 1].map((r) => (
                  <button
                    key={r}
                    onClick={() => model.change(requestResource(s, p, r))}
                  >
                    Request {"AB"[r]}
                  </button>
                ))}
                <button onClick={() => model.change(releaseResources(s, p))}>
                  Release resources
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function PacketBench() {
  const model = useMaterial(newNetwork()),
    s = model.state;
  return (
    <Workbench
      id="packets"
      model={model}
      assumptions="Two directed links: source → router → destination. FIFO queues hold three packets each. You deliver one packet per action. Disconnecting links pauses delivery; a full router drops arrivals. No automatic timing or retransmission."
      readings={
        <>
          <Stat label="Delivered" value={s.delivered} />
          <Stat label="Dropped" value={s.dropped} />
        </>
      }
    >
      <div className="play-actions">
        <button
          className="play-primary"
          onClick={() => model.change(networkAction(s, "inject"))}
        >
          Create packet
        </button>
      </div>
      <div className="play-network">
        {[0, 1].map((at) => (
          <React.Fragment key={at}>
            <div className="play-queue">
              <h3>{at === 0 ? "Source" : "Router"}</h3>
              <div className="play-packet-stack">
                {s.packets
                  .filter((p) => p.at === at)
                  .map((p) => (
                    <div className="play-tile" key={p.id}>
                      P{p.id}
                    </div>
                  ))}
                {!s.packets.some((p) => p.at === at) && (
                  <span className="play-empty">Empty queue</span>
                )}
              </div>
              <div className="play-actions">
                <button
                  onClick={() => model.change(networkAction(s, "forward", at))}
                >
                  Send next →
                </button>
                <button
                  onClick={() => model.change(networkAction(s, "drop", at))}
                >
                  Drop next
                </button>
              </div>
            </div>
            <button
              className={`play-wire ${s.links[at] ? "is-on" : ""}`}
              aria-pressed={s.links[at]}
              onClick={() => model.change(networkAction(s, "toggle", at))}
              aria-label={`Toggle link ${at + 1}`}
            >
              {s.links[at] ? "──→" : "─  ─"}
              <small>
                Link {at + 1}
                <br />
                {s.links[at] ? "Cut" : "Reconnect"}
              </small>
            </button>
          </React.Fragment>
        ))}
        <div className="play-destination">
          <small>Destination</small>
          <output>{s.delivered}</output>
          <span>received</span>
        </div>
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export interface QuorumState {
  online: boolean[];
  ack: boolean[];
  proposed: boolean;
  committed: boolean;
  message: string;
}
export const newQuorum = (): QuorumState => ({
  online: [true, true, true, true, true],
  ack: [false, false, false, false, false],
  proposed: false,
  committed: false,
  message:
    "Node 1 is already leader. Propose an entry and choose which peers acknowledge it.",
});
export function quorumAction(
  s: QuorumState,
  action: "toggle" | "propose" | "ack",
  node = 0,
): QuorumState {
  if (action === "toggle")
    return {
      ...s,
      online: s.online.map((on, i) => (i === node ? !on : on)),
      message: `Node ${node + 1} ${s.online[node] ? "disconnected" : "reconnected"}.${s.committed ? " The committed entry stays committed." : ""}`,
    };
  if (action === "propose") {
    if (!s.online[0])
      return {
        ...s,
        message: "The leader is disconnected. Reconnect it to propose.",
      };
    if (s.proposed)
      return {
        ...s,
        message:
          "This single-entry experiment already has a proposal. Deliver acknowledgements or reset.",
      };
    return {
      ...s,
      proposed: true,
      ack: [true, false, false, false, false],
      message:
        "Leader stores x = 1 locally. Two other acknowledgements are needed for a majority.",
    };
  }
  if (!s.proposed)
    return {
      ...s,
      message: "Propose an entry before delivering an acknowledgement.",
    };
  if (!s.online[0] || !s.online[node])
    return {
      ...s,
      message:
        "Both leader and peer must be connected to deliver this acknowledgement.",
    };
  const ack = s.ack.map((on, i) => (i === node ? true : on)),
    committed = s.committed || ack.filter(Boolean).length >= 3;
  return {
    ...s,
    ack,
    committed,
    message: s.ack[node]
      ? `Node ${node + 1} already acknowledged this entry.`
      : `Node ${node + 1} stores and acknowledges x = 1.${committed ? " A majority has acknowledged: the entry is committed." : " Still waiting for a majority."}`,
  };
}
export function QuorumBench() {
  const model = useMaterial(newQuorum()),
    s = model.state;
  return (
    <Workbench
      id="quorum"
      model={model}
      assumptions="A fixed five-node cluster, an already elected leader in one term, and one current-term entry. Connections are to the leader. Acknowledgements represent durable log writes and survive disconnection. No new elections, conflicting logs, or node data loss are modeled."
      readings={
        <>
          <Stat
            label="Acknowledgements"
            value={`${s.ack.filter(Boolean).length} / 5`}
          />
          <Stat
            label="Entry"
            value={
              s.committed
                ? "Committed"
                : s.proposed
                  ? "Pending"
                  : "Not proposed"
            }
          />
        </>
      }
    >
      <div className="play-actions">
        <button
          className="play-primary"
          onClick={() => model.change(quorumAction(s, "propose"))}
        >
          Propose x = 1
        </button>
      </div>
      <div className="play-cluster">
        {s.online.map((online, i) => (
          <div className={`play-peer ${online ? "" : "is-offline"}`} key={i}>
            <button
              className={`play-node ${s.ack[i] ? "is-on" : ""}`}
              aria-label={`Toggle node ${i + 1} connection`}
              aria-pressed={online}
              onClick={() => model.change(quorumAction(s, "toggle", i))}
            >
              {i + 1}
            </button>
            <strong>{i === 0 ? "Leader" : "Follower"}</strong>
            <small>{online ? "Connected" : "Disconnected"}</small>
            <code>{s.ack[i] ? "log: x = 1" : "log: empty"}</code>
            {i > 0 && (
              <button onClick={() => model.change(quorumAction(s, "ack", i))}>
                Deliver ack
              </button>
            )}
          </div>
        ))}
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
export function TransactionBench() {
  const model = useMaterial(newTransaction()),
    s = model.state;
  return (
    <Workbench
      id="transactions"
      model={model}
      assumptions="One transaction at a time. Transfers update a private working copy atomically; commit replaces both durable balances together. Crash discards the working copy. This illustrates atomicity and durability, not concurrent isolation or a real storage engine."
      readings={<Stat label="Durable total" value={s.saved[0] + s.saved[1]} />}
    >
      <div className="play-two-columns">
        {[
          { label: "Durable storage", values: s.saved },
          { label: "Working copy", values: s.draft },
        ].map(({ label, values }) => (
          <div className="play-bank" key={label}>
            <h3>{label}</h3>
            <div className="play-objects">
              {values ? (
                values.map((value, i) => (
                  <div className="play-tile" key={i}>
                    <small>Account {"AB"[i]}</small>
                    <b>{value}</b>
                    <div
                      className="play-balance"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                ))
              ) : (
                <span className="play-empty">No transaction open</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="play-actions">
        {(["begin", "transfer", "commit", "crash"] as const).map((action) => (
          <button
            className={action === "transfer" ? "play-primary" : ""}
            key={action}
            onClick={() => model.change(transactionAction(s, action))}
          >
            {
              {
                begin: "Begin transaction",
                transfer: "Move 10: A → B",
                commit: "Commit",
                crash: "Crash",
              }[action]
            }
          </button>
        ))}
      </div>
      <Feedback>{s.message}</Feedback>
    </Workbench>
  );
}
