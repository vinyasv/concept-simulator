/** Small deterministic materials. UI actions call these same functions as the tests. */
export interface ThreadState {
  shared: number;
  local: (number | null)[];
  pc: number[];
  lock: boolean;
  owner: number | null;
  message: string;
}
export const newThreads = (lock = false): ThreadState => ({
  shared: 0,
  local: [null, null],
  pc: [0, 0],
  lock,
  owner: null,
  message: "Both threads want to add one. Choose which thread runs first.",
});
export function runThread(state: ThreadState, thread: number): ThreadState {
  if (thread !== 0 && thread !== 1) return state;
  const name = thread === 0 ? "A" : "B";
  if (state.pc[thread] === 2)
    return {
      ...state,
      message: `Thread ${name} has finished. Reset to try another order.`,
    };
  if (state.lock && state.owner !== null && state.owner !== thread)
    return {
      ...state,
      message: `Thread ${name} is waiting: the other thread holds the mutex.`,
    };
  const next = { ...state, pc: [...state.pc], local: [...state.local] };
  if (state.pc[thread] === 0) {
    next.local[thread] = state.shared;
    next.pc[thread] = 1;
    next.owner = state.lock ? thread : null;
    next.message = `${name} reads ${state.shared} into its own local memory.`;
  } else {
    next.shared = state.local[thread]! + 1;
    next.pc[thread] = 2;
    next.owner = null;
    next.message = `${name} writes ${next.shared}.${next.pc.every((p) => p === 2) ? (next.shared === 2 ? " Both increments survived." : " One update was lost. Try a different order.") : ""}`;
  }
  return next;
}
export type CollectionKind =
  "Stack" | "Queue" | "Set" | "Array" | "Linked list";
export interface CollectionState {
  items: number[];
  capacity: number;
  cost: number;
  message: string;
}
export const newCollection = (): CollectionState => ({
  items: [3, 1, 3],
  capacity: 4,
  cost: 0,
  message:
    "Add an item, or choose an item to remove. What changes when you switch the structure?",
});
export function collectionAction(
  s: CollectionState,
  kind: CollectionKind,
  action: "add" | "remove",
  value: number,
): CollectionState {
  if (action === "add") {
    if (s.items.length >= 12)
      return {
        ...s,
        message: "The tray holds 12 items. Remove one to make room.",
      };
    if (kind === "Set" && s.items.includes(value))
      return {
        ...s,
        cost: 0,
        message: `${value} is already in the set; a second copy is not inserted.`,
      };
    const grow = s.items.length === s.capacity;
    return {
      items: [...s.items, value],
      capacity: grow ? s.capacity * 2 : s.capacity,
      cost: kind === "Array" && grow ? s.items.length + 1 : 1,
      message:
        kind === "Array" && grow
          ? `Copied ${s.items.length} items into a larger array, then appended ${value}.`
          : `Added ${value}${kind === "Stack" ? " at the top" : kind === "Queue" ? " at the back" : ""}.`,
    };
  }
  if (!s.items.length)
    return {
      ...s,
      cost: 0,
      message: "The structure is empty. There is no item to remove.",
    };
  const index =
    kind === "Stack" ? s.items.length - 1 : kind === "Queue" ? 0 : value;
  if (index < 0 || index >= s.items.length) return s;
  const items = s.items.filter((_, i) => i !== index);
  return {
    ...s,
    items,
    cost: kind === "Array" ? s.items.length - index : 1,
    message: `Removed ${s.items[index]}${kind === "Array" ? `; shifted ${s.items.length - index - 1} items left` : kind === "Linked list" ? "; reconnected the neighboring pointers" : ""}.`,
  };
}
export interface DeadlockState {
  owners: (number | null)[];
  waiting: (number | null)[];
  message: string;
}
export const newDeadlock = (): DeadlockState => ({
  owners: [null, null],
  waiting: [null, null],
  message: "Give each process a resource, then ask for the other one.",
});
export const isDeadlocked = (s: DeadlockState) =>
  s.waiting[0] !== null &&
  s.waiting[1] !== null &&
  s.owners[s.waiting[0]] === 1 &&
  s.owners[s.waiting[1]] === 0;
export function requestResource(
  s: DeadlockState,
  process: number,
  resource: number,
): DeadlockState {
  const next = { ...s, owners: [...s.owners], waiting: [...s.waiting] };
  if (s.owners[resource] === process)
    return {
      ...s,
      message: `P${process + 1} already holds ${"AB"[resource]}.`,
    };
  if (s.waiting[process] !== null)
    return {
      ...s,
      message: `P${process + 1} is blocked. Release its resources to recover.`,
    };
  if (s.owners[resource] === null) {
    next.owners[resource] = process;
    next.message = `P${process + 1} acquired ${"AB"[resource]}.`;
  } else {
    next.waiting[process] = resource;
    next.message = `P${process + 1} waits for ${"AB"[resource]}, held by P${s.owners[resource]! + 1}.`;
  }
  if (isDeadlocked(next))
    next.message =
      "A circular wait: neither process can continue. Release resources to recover.";
  return next;
}
export function releaseResources(
  s: DeadlockState,
  process: number,
): DeadlockState {
  const next = {
    ...s,
    owners: s.owners.map((owner) => (owner === process ? null : owner)),
    waiting: [...s.waiting],
    message: `P${process + 1} released its resources (manual recovery).`,
  };
  next.waiting[process] = null;
  next.waiting.forEach((resource, p) => {
    if (resource !== null && next.owners[resource] === null) {
      next.owners[resource] = p;
      next.waiting[p] = null;
      next.message += ` P${p + 1} acquired ${"AB"[resource]}.`;
    }
  });
  return next;
}
export interface CacheState {
  slots: number[];
  hits: number;
  misses: number;
  last: number | null;
  message: string;
}
export const newCache = (): CacheState => ({
  slots: [],
  hits: 0,
  misses: 0,
  last: null,
  message: "Touch a memory address to read it. Try repeating a short pattern.",
});
export function accessCache(
  s: CacheState,
  address: number,
  capacity: number,
): CacheState {
  const hit = s.slots.includes(address),
    evicted = !hit && s.slots.length === capacity ? s.slots[0] : null;
  return {
    slots: [...s.slots.filter((n) => n !== address), address].slice(-capacity),
    hits: s.hits + Number(hit),
    misses: s.misses + Number(!hit),
    last: address,
    message: hit
      ? `Address ${address} is a hit. It becomes most recently used.`
      : `Address ${address} is a miss; fetched from memory.${evicted !== null ? ` Evicted ${evicted}, the least recently used.` : ""}`,
  };
}
export type Edge = [number, number];
export function traverseGraph(
  edges: Edge[],
  start: number,
  mode: "BFS" | "DFS",
) {
  const visited: number[] = [],
    pending = [start];
  while (pending.length && visited.length < 8) {
    const node = mode === "BFS" ? pending.shift()! : pending.pop()!;
    if (visited.includes(node)) continue;
    visited.push(node);
    const neighbors = edges
      .flatMap(([a, b]) => (a === node ? [b] : b === node ? [a] : []))
      .sort((a, b) => a - b);
    pending.push(
      ...(mode === "DFS" ? neighbors.reverse() : neighbors).filter(
        (n) => !visited.includes(n),
      ),
    );
  }
  return visited;
}
export interface Packet {
  id: number;
  at: number;
}
export interface NetworkState {
  packets: Packet[];
  links: boolean[];
  delivered: number;
  dropped: number;
  nextId: number;
  message: string;
}
export const newNetwork = (): NetworkState => ({
  packets: [{ id: 1, at: 0 }],
  links: [true, true],
  delivered: 0,
  dropped: 0,
  nextId: 2,
  message:
    "Send a packet along either link. Disconnect a link to trap it at the router.",
});
export function networkAction(
  s: NetworkState,
  action: "inject" | "forward" | "toggle" | "drop",
  target = 0,
): NetworkState {
  if (action === "toggle")
    return {
      ...s,
      links: s.links.map((on, i) => (i === target ? !on : on)),
      message: `Link ${target + 1} ${s.links[target] ? "disconnected" : "reconnected"}.`,
    };
  if (action === "inject")
    return s.packets.filter((p) => p.at === 0).length >= 3
      ? {
          ...s,
          dropped: s.dropped + 1,
          message: "Source queue full: the new packet was dropped.",
        }
      : {
          ...s,
          packets: [...s.packets, { id: s.nextId, at: 0 }],
          nextId: s.nextId + 1,
          message: `Packet ${s.nextId} joined the source queue.`,
        };
  const packet = s.packets.find((p) => p.at === target);
  if (!packet)
    return { ...s, message: "This queue is empty. Send a packet here first." };
  if (action === "drop")
    return {
      ...s,
      packets: s.packets.filter((p) => p.id !== packet.id),
      dropped: s.dropped + 1,
      message: `Packet ${packet.id} was dropped deliberately.`,
    };
  if (!s.links[target])
    return {
      ...s,
      message: `Link ${target + 1} is disconnected. Packet ${packet.id} stays queued.`,
    };
  if (target === 0 && s.packets.filter((p) => p.at === 1).length >= 3)
    return {
      ...s,
      packets: s.packets.filter((p) => p.id !== packet.id),
      dropped: s.dropped + 1,
      message: `Router queue full: packet ${packet.id} was dropped.`,
    };
  return {
    ...s,
    packets:
      target === 1
        ? s.packets.filter((p) => p.id !== packet.id)
        : s.packets.map((p) => (p.id === packet.id ? { ...p, at: 1 } : p)),
    delivered: s.delivered + Number(target === 1),
    message: `Packet ${packet.id} ${target === 1 ? "reached the destination" : "arrived at the router"}.`,
  };
}
export interface TransactionState {
  saved: number[];
  draft: number[] | null;
  message: string;
}
export const newTransaction = (): TransactionState => ({
  saved: [60, 40],
  draft: null,
  message:
    "Begin a transfer. Crash before committing, then try again and commit.",
});
export function transactionAction(
  s: TransactionState,
  action: "begin" | "transfer" | "commit" | "crash",
  amount = 10,
): TransactionState {
  if (action === "begin")
    return s.draft
      ? { ...s, message: "A transaction is already open." }
      : {
          ...s,
          draft: [...s.saved],
          message:
            "A private working copy is open. Durable balances have not changed.",
        };
  if (action === "crash")
    return {
      ...s,
      draft: null,
      message:
        "Crash: uncommitted work is discarded. Durable balances survive.",
    };
  if (!s.draft) return { ...s, message: "Begin a transaction first." };
  if (action === "commit")
    return {
      saved: [...s.draft],
      draft: null,
      message:
        "Committed both balances together. These values now survive a crash.",
    };
  if (s.draft[0] < amount)
    return {
      ...s,
      message: "Insufficient funds in A. The transfer made no changes.",
    };
  return {
    ...s,
    draft: [s.draft[0] - amount, s.draft[1] + amount],
    message: `Moved ${amount} from A to B in the working copy; total remains ${s.saved[0] + s.saved[1]}.`,
  };
}
export function moveDisk(towers: number[][], from: number, to: number) {
  if (from === to || !towers[from]?.length || !towers[to]) return towers;
  const disk = towers[from].at(-1)!;
  if (towers[to].length && towers[to].at(-1)! < disk) return towers;
  return towers.map((tower, i) =>
    i === from ? tower.slice(0, -1) : i === to ? [...tower, disk] : [...tower],
  );
}
export const byteBits = (value: number) =>
  (value & 255).toString(2).padStart(8, "0");
export function bitResult(a: number, b: number, op: string) {
  return (
    (op === "AND"
      ? a & b
      : op === "OR"
        ? a | b
        : op === "XOR"
          ? a ^ b
          : op === "NOT A"
            ? ~a
            : op === "A << 1"
              ? a << 1
              : a >>> 1) & 255
  );
}
export function hashInsert(buckets: number[][], value: number) {
  const bucket = ((value % buckets.length) + buckets.length) % buckets.length;
  return buckets.map((items, i) =>
    i === bucket && !items.includes(value) ? [...items, value] : [...items],
  );
}
export const gradientStep = (x: number, rate: number) => x - rate * 2 * (x - 3);
