export const convertBase = (value: number, base: number) =>
  Math.max(0, Math.min(255, Math.floor(value))).toString(base).toUpperCase();

export const evenParity = (bits: number[]) => bits.reduce((sum, bit) => sum + bit, 0) % 2;
export const parityValid = (bits: number[], parity: number) => evenParity(bits) === parity;

export const runLengthEncode = (text: string) => {
  if (!text) return [] as { symbol: string; count: number }[];
  const runs = [{ symbol: text[0], count: 1 }];
  for (const symbol of text.slice(1)) {
    const last = runs[runs.length - 1];
    if (last.symbol === symbol) last.count += 1;
    else runs.push({ symbol, count: 1 });
  }
  return runs;
};

export const insertAt = (values: number[], index: number, value: number) => [
  ...values.slice(0, index), value, ...values.slice(index),
];
export const removeAt = <T,>(values: T[], index: number) => values.filter((_, i) => i !== index);

export const unionGroups = (parents: number[], a: number, b: number) => {
  const root = (n: number) => { while (parents[n] !== n) n = parents[n]; return n; };
  const ra = root(a), rb = root(b);
  if (ra === rb) return parents;
  return parents.map((parent, i) => root(i) === rb ? ra : parent);
};

export const heapInsert = (heap: number[], value: number) => {
  const next = [...heap, value];
  let i = next.length - 1;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (next[parent] <= next[i]) break;
    [next[parent], next[i]] = [next[i], next[parent]];
    i = parent;
  }
  return next;
};
export const heapPop = (heap: number[]) => {
  if (heap.length < 2) return [];
  const next = [heap[heap.length - 1], ...heap.slice(1, -1)];
  let i = 0;
  while (true) {
    const left = i * 2 + 1, right = left + 1;
    if (left >= next.length) break;
    const child = right < next.length && next[right] < next[left] ? right : left;
    if (next[i] <= next[child]) break;
    [next[i], next[child]] = [next[child], next[i]];
    i = child;
  }
  return next;
};

export type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null };
export const treeInsert = (node: TreeNode | null, value: number): TreeNode =>
  node === null ? { value, left: null, right: null }
    : value === node.value ? node
      : value < node.value ? { ...node, left: treeInsert(node.left, value) }
        : { ...node, right: treeInsert(node.right, value) };
export const treePath = (node: TreeNode | null, value: number, path: number[] = []): number[] =>
  node === null ? path : node.value === value ? [...path, node.value]
    : treePath(value < node.value ? node.left : node.right, value, [...path, node.value]);

export const reachableObjects = (roots: number[], links: number[][]) => {
  const seen = new Set<number>(), work = [...roots];
  while (work.length) {
    const value = work.shift()!;
    if (seen.has(value)) continue;
    seen.add(value);
    work.push(...(links[value] ?? []));
  }
  return seen;
};

export const pageForAddress = (address: number, pageSize = 4) => ({
  page: Math.floor(address / pageSize), offset: address % pageSize,
});

export const binarySearchStep = (values: number[], target: number, low: number, high: number) => {
  if (low > high) return { low, high, mid: -1, found: false };
  const mid = Math.floor((low + high) / 2);
  if (values[mid] === target) return { low: mid, high: mid, mid, found: true };
  return values[mid] < target
    ? { low: mid + 1, high, mid, found: false }
    : { low, high: mid - 1, mid, found: false };
};

export type WeightedEdge = [number, number, number];
export const shortestDistances = (count: number, edges: WeightedEdge[], start: number) => {
  const distance = Array(count).fill(Infinity); distance[start] = 0;
  const visited = new Set<number>();
  while (visited.size < count) {
    let node = -1;
    for (let i = 0; i < count; i++)
      if (!visited.has(i) && (node < 0 || distance[i] < distance[node])) node = i;
    if (node < 0 || !Number.isFinite(distance[node])) break;
    visited.add(node);
    for (const [a, b, weight] of edges) {
      if (a === node) distance[b] = Math.min(distance[b], distance[a] + weight);
      if (b === node) distance[a] = Math.min(distance[a], distance[b] + weight);
    }
  }
  return distance;
};

export const factorialFrames = (n: number) => {
  const stack = Array.from({ length: Math.max(1, n) }, (_, i) => n - i);
  return stack.map((_, i) => ({ stack: stack.slice(0, stack.length - i), partial: stack.slice(stack.length - i).reduce((a, b) => a * b, 1) }));
};

export const coinChange = (coins: number[], target: number) => {
  const best = Array(target + 1).fill(Infinity); best[0] = 0;
  for (let amount = 1; amount <= target; amount++)
    for (const coin of coins) if (coin <= amount) best[amount] = Math.min(best[amount], best[amount - coin] + 1);
  return best;
};

export const knapsackValue = (selected: boolean[], weights: number[], values: number[]) => ({
  weight: selected.reduce((sum, on, i) => sum + (on ? weights[i] : 0), 0),
  value: selected.reduce((sum, on, i) => sum + (on ? values[i] : 0), 0),
});

export const matchAt = (text: string, pattern: string, index: number) =>
  text.slice(index, index + pattern.length) === pattern;

export const advancePipeline = (slots: (string | null)[], incoming: string | null, stalled: boolean) =>
  stalled ? slots : [incoming, ...slots.slice(0, -1)];

export const scheduleProcess = (remaining: number[], index: number, quantum: number) =>
  remaining.map((value, i) => i === index ? Math.max(0, value - quantum) : value);

export const allocateFile = (blocks: (string | null)[], name: string, count: number, contiguous: boolean) => {
  const next = [...blocks];
  if (contiguous) {
    for (let start = 0; start <= next.length - count; start++)
      if (next.slice(start, start + count).every(v => v === null)) {
        for (let i = start; i < start + count; i++) next[i] = name;
        return next;
      }
    return blocks;
  }
  const free = next.flatMap((value, i) => value === null ? [i] : []).slice(0, count);
  if (free.length < count) return blocks;
  free.forEach(i => next[i] = name);
  return next;
};

export const updatePredictor = (counter: number, taken: boolean) => Math.max(0, Math.min(3, counter + (taken ? 1 : -1)));

export const chooseLeastLoaded = (loads: number[], online: boolean[]) => {
  let choice = -1;
  loads.forEach((load, i) => { if (online[i] && (choice < 0 || load < loads[choice])) choice = i; });
  return choice;
};

export const tcpEvent = (window: number, event: "ack" | "loss") => event === "ack" ? Math.min(16, window + 1) : Math.max(1, Math.floor(window / 2));

export const btreeInsert = (keys: number[], value: number) => [...new Set([...keys, value])].sort((a, b) => a - b);
export const planCost = (left: number, right: number, indexed: boolean) => indexed ? left + Math.ceil(Math.log2(Math.max(2, right))) : left * right;
export const classify = (feature: number, threshold: number) => feature <= threshold ? "Blue" : "Red";
export const neuronOutput = (inputs: number[], weights: number[], bias: number) => inputs.reduce((sum, input, i) => sum + input * weights[i], bias) >= 0 ? 1 : 0;
export const qUpdate = (oldValue: number, reward: number, nextBest: number, rate = .5, discount = .9) => oldValue + rate * (reward + discount * nextBest - oldValue);
export const canAccess = (role: string, resource: string) => ({ reader: ["Article"], editor: ["Article", "Draft"], admin: ["Article", "Draft", "Users"] }[role] ?? []).includes(resource);
