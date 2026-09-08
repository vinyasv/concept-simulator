import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newThreads,
  runThread,
  newCollection,
  collectionAction,
  newDeadlock,
  requestResource,
  releaseResources,
  isDeadlocked,
  newCache,
  accessCache,
  traverseGraph,
  newNetwork,
  networkAction,
  newTransaction,
  transactionAction,
  moveDisk,
  bitResult,
  hashInsert,
  gradientStep,
} from "./playground";
import { newQuorum, quorumAction } from "../components/playground/Systems";
import { joinRows, feedMachine } from "../components/playground/Decisions";
import { sortingLesson } from "./algorithms";
import { LIBRARY_DATA, DEMONSTRATION_LIBRARY_DATA } from "../constants";
import { playgrounds } from "./playgroundCatalog";
import {
  convertBase, evenParity, parityValid, runLengthEncode, insertAt, unionGroups,
  heapInsert, heapPop, treeInsert, treePath, reachableObjects, pageForAddress,
  binarySearchStep, shortestDistances, factorialFrames, coinChange, knapsackValue,
  matchAt, advancePipeline, scheduleProcess, allocateFile, updatePredictor,
  chooseLeastLoaded, tcpEvent, btreeInsert, planCost, classify, neuronOutput,
  qUpdate, canAccess,
} from "./expandedPlayground";

test("choosing the interleaving can lose or preserve an update; mutex blocks stale reads", () => {
  const run = (sequence: number[], locked: boolean) =>
    sequence.reduce(runThread, newThreads(locked));
  assert.equal(run([0, 1, 0, 1], false).shared, 1);
  assert.equal(run([0, 0, 1, 1], false).shared, 2);
  assert.equal(run([0, 1, 0, 1, 1], true).shared, 2);
  const blocked = run([0, 1], true);
  assert.deepEqual(blocked.pc, [1, 0]);
  assert.deepEqual(blocked.local, [0, null]);
  assert.equal(blocked.owner, 0);
  assert.equal(newThreads().shared, 0);
});
test("structures remove by their semantics; duplicate sets and empty removal are safe", () => {
  const initial = newCollection();
  assert.deepEqual(
    collectionAction(initial, "Stack", "remove", 0).items,
    [3, 1],
  );
  assert.deepEqual(
    collectionAction(initial, "Queue", "remove", 0).items,
    [1, 3],
  );
  assert.deepEqual(
    collectionAction(initial, "Array", "remove", 1).items,
    [3, 3],
  );
  const unique = { ...initial, items: [3, 1] };
  assert.deepEqual(collectionAction(unique, "Set", "add", 3).items, [3, 1]);
  assert.deepEqual(
    collectionAction({ ...initial, items: [] }, "Stack", "remove", 0).items,
    [],
  );
  const full = { ...initial, items: [1, 2, 3, 4] };
  const grown = collectionAction(full, "Array", "add", 5);
  assert.equal(grown.capacity, 8);
  assert.equal(grown.cost, 5);
  assert.deepEqual(
    initial.items,
    [3, 1, 3],
    "Actions do not mutate earlier history",
  );
});
test("manual requests can create deadlock and release resolves the cycle", () => {
  let s = requestResource(newDeadlock(), 0, 0);
  s = requestResource(s, 1, 1);
  s = requestResource(s, 0, 1);
  assert.equal(isDeadlocked(s), false);
  s = requestResource(s, 1, 0);
  assert.equal(isDeadlocked(s), true);
  const recovered = releaseResources(s, 0);
  assert.equal(isDeadlocked(recovered), false);
  assert.deepEqual(recovered.owners, [1, 1]);
  assert.deepEqual(recovered.waiting, [null, null]);
});
test("LRU updates recency on a hit and evicts the actual least recent entry", () => {
  const s = [0, 1, 2, 0, 3].reduce((s, n) => accessCache(s, n, 3), newCache());
  assert.deepEqual(s.slots, [2, 0, 3]);
  assert.equal(s.hits, 1);
  assert.equal(s.misses, 4);
});
test("edited topology changes reachability; BFS and DFS have different valid orders", () => {
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 5],
  ];
  assert.deepEqual(traverseGraph(edges, 0, "BFS"), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(traverseGraph(edges, 0, "DFS"), [0, 1, 3, 5, 2, 4]);
  assert.deepEqual(traverseGraph([], 3, "BFS"), [3]);
});
test("packets respect disconnected links, FIFO and queue capacity", () => {
  const initial = newNetwork();
  const cut = networkAction(initial, "toggle", 0);
  assert.deepEqual(networkAction(cut, "forward", 0).packets, initial.packets);
  let s = networkAction(initial, "forward", 0);
  assert.equal(s.packets[0].at, 1);
  s = networkAction(s, "forward", 1);
  assert.equal(s.delivered, 1);
  assert.equal(s.packets.length, 0);
  s = [0, 1, 2, 3, 4].reduce((s) => networkAction(s, "inject"), newNetwork());
  assert.equal(s.packets.length, 3);
  assert.equal(s.dropped, 3);
});
test("an entry needs three unique durable acknowledgements; disconnection does not undo commit", () => {
  let s = quorumAction(newQuorum(), "propose");
  s = quorumAction(s, "ack", 1);
  s = quorumAction(s, "ack", 1);
  assert.equal(s.ack.filter(Boolean).length, 2);
  assert.equal(s.committed, false);
  s = quorumAction(s, "toggle", 2);
  assert.equal(quorumAction(s, "ack", 2).committed, false);
  s = quorumAction(s, "ack", 3);
  assert.equal(s.committed, true);
  s = quorumAction(s, "toggle", 3);
  assert.equal(s.committed, true);
  assert.equal(quorumAction(newQuorum(), "ack", 2).proposed, false);
});
test("crashing before commit discards changes, crashing after commit preserves both balances", () => {
  const draft = transactionAction(
    transactionAction(newTransaction(), "begin"),
    "transfer",
    10,
  );
  assert.deepEqual(draft.saved, [60, 40]);
  assert.deepEqual(draft.draft, [50, 50]);
  assert.deepEqual(transactionAction(draft, "crash").saved, [60, 40]);
  assert.deepEqual(
    transactionAction(transactionAction(draft, "commit"), "crash").saved,
    [50, 50],
  );
  assert.deepEqual(transactionAction(draft, "transfer", 100).draft, [50, 50]);
});
test("Hanoi rejects illegal moves and accepts a known seven-move solution", () => {
  const initial = [[3, 2, 1], [], []];
  let s = moveDisk(initial, 0, 2);
  assert.equal(moveDisk(s, 0, 2), s);
  for (const [from, to] of [
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 0],
    [1, 2],
    [0, 2],
  ])
    s = moveDisk(s, from, to);
  assert.deepEqual(s, [[], [], [3, 2, 1]]);
  assert.deepEqual(initial, [[3, 2, 1], [], []]);
});
test("bit operations wrap in the stated eight-bit domain", () => {
  assert.equal(bitResult(5, 3, "AND"), 1);
  assert.equal(bitResult(5, 3, "XOR"), 6);
  assert.equal(bitResult(255, 0, "A << 1"), 254);
  assert.equal(bitResult(0, 0, "NOT A"), 255);
});
test("hash collisions preserve keys with chaining and duplicate keys are ignored", () => {
  const s = [2, 7, 12, 7].reduce(hashInsert, [
    [],
    [],
    [],
    [],
    [],
  ] as number[][]);
  assert.deepEqual(s, [[], [], [2, 7, 12], [], []]);
});
test("joins retain multiplicity and left join retains unmatched people", () => {
  assert.deepEqual(joinRows([1, 2, 3], [1, 1, 4], false), [
    { person: 0, pet: 0 },
    { person: 0, pet: 1 },
  ]);
  assert.equal(joinRows([1, 2, 3], [1, 1, 4], true).length, 4);
});
test("rewiring a finite automaton changes the same input's destination", () => {
  const word = [1, 0, 1];
  assert.equal(
    word.reduce(
      (s, b) =>
        feedMachine(
          [
            [0, 1],
            [0, 1],
          ],
          s,
          b,
        ),
      0,
    ),
    1,
  );
  assert.equal(
    word.reduce(
      (s, b) =>
        feedMachine(
          [
            [0, 1],
            [1, 0],
          ],
          s,
          b,
        ),
      0,
    ),
    0,
  );
});
test("gradient choices converge, overshoot, or stay at the minimum", () => {
  assert.equal(gradientStep(-4, 0.5), 3);
  assert.ok(Math.abs(gradientStep(-4, 1.1) - 3) > 7);
  assert.equal(gradientStep(3, 1.1), 3);
});
test("symbol materials preserve quantity and expose transmission redundancy", () => {
  assert.equal(convertBase(42, 2), "101010");
  assert.equal(convertBase(255, 16), "FF");
  const bits = [1, 0, 1, 1, 0, 0, 1];
  assert.equal(evenParity(bits), 0);
  assert.equal(parityValid(bits, 0), true);
  assert.equal(parityValid(bits.map((b, i) => i === 2 ? 1 - b : b), 0), false);
  assert.deepEqual(runLengthEncode("AAABBCCCC"), [
    { symbol: "A", count: 3 }, { symbol: "B", count: 2 }, { symbol: "C", count: 4 },
  ]);
});
test("memory materials perform structural changes without mutating prior state", () => {
  const values = [3, 7, 9];
  assert.deepEqual(insertAt(values, 1, 5), [3, 5, 7, 9]);
  assert.deepEqual(values, [3, 7, 9]);
  let parents = [0, 1, 2, 3];
  parents = unionGroups(parents, 0, 1);
  parents = unionGroups(parents, 2, 3);
  assert.deepEqual(unionGroups(parents, 1, 3), [0, 0, 0, 0]);
  const heap = [7, 2, 5, 1].reduce(heapInsert, [] as number[]);
  assert.equal(heap[0], 1);
  assert.equal(heapPop(heap)[0], 2);
  const tree = [8, 4, 12, 6].reduce(treeInsert, null);
  assert.deepEqual(treePath(tree, 6), [8, 4, 6]);
  assert.deepEqual([...reachableObjects([0], [[1], [2], [], [4], []])], [0, 1, 2]);
  assert.deepEqual(pageForAddress(13), { page: 3, offset: 1 });
});
test("algorithm materials respond to learner-chosen inputs", () => {
  const values = [2, 5, 8, 12, 16, 23, 31, 40];
  let search = { low: 0, high: values.length - 1, mid: -1, found: false };
  for (let i = 0; i < 4 && !search.found; i++) search = binarySearchStep(values, 23, search.low, search.high);
  assert.equal(search.found, true);
  assert.deepEqual(shortestDistances(4, [[0,1,2],[0,2,5],[1,2,1],[2,3,1]], 0), [0,2,3,4]);
  assert.equal(factorialFrames(5)[0].stack.reduce((a,b) => a*b, 1), 120);
  assert.equal(coinChange([1,3,4], 6)[6], 2);
  assert.deepEqual(knapsackValue([true,false,false,true],[2,3,4,5],[3,4,5,8]), { weight:7, value:11 });
  assert.equal(matchAt("BANANA", "ANA", 1), true);
});
test("systems materials preserve their operational constraints", () => {
  assert.deepEqual(advancePipeline(["I1",null,null], "I2", false), ["I2","I1",null]);
  assert.deepEqual(advancePipeline(["I1",null,null], "I2", true), ["I1",null,null]);
  assert.deepEqual(scheduleProcess([5,3,7], 1, 2), [5,1,7]);
  const fragmented = ["A",null,"A",null,null] as (string|null)[];
  assert.equal(allocateFile(fragmented,"B",3,true), fragmented);
  assert.deepEqual(allocateFile(fragmented,"B",3,false), ["A","B","A","B","B"]);
  assert.equal(updatePredictor(1,true),2);
  assert.equal(chooseLeastLoaded([3,0,1],[true,false,true]),2);
  assert.equal(tcpEvent(8,"loss"),4);
});
test("decision materials recompute from the state the learner changes", () => {
  assert.deepEqual(btreeInsert([3,7,11],5), [3,5,7,11]);
  assert.ok(planCost(4,8,true) < planCost(4,8,false));
  assert.equal(classify(4,4),"Blue");
  assert.equal(neuronOutput([1,0],[1,1],-1),1);
  assert.ok(qUpdate(0,1,0) > qUpdate(0,-1,0));
  assert.equal(canAccess("reader","Draft"),false);
  assert.equal(canAccess("editor","Draft"),true);
});
test("every sorting demonstration uses exactly the learner's arrangement", () => {
  for (const mode of ["bubble", "insertion", "merge", "quick"] as const) {
    const frames = sortingLesson(mode).run({ items: "6,2,5,1,4,3" });
    assert.deepEqual(frames[0].values, [6, 2, 5, 1, 4, 3]);
    assert.deepEqual(frames.at(-1)!.values, [1, 2, 3, 4, 5, 6]);
  }
});
test("learner-facing CS library maps every item to a hands-on material", () => {
  const cs = LIBRARY_DATA.find((c) => c.id === "cs")!.subcategories.flatMap(
    (s) => s.items,
  );
  assert.equal(cs.length, playgrounds.length);
  assert.equal(cs.length, 50);
  assert.ok(
    cs.every(
      (item) =>
        item.cachedCode!.includes("PlaygroundSimulation") &&
        item.description &&
        item.keywords,
    ),
  );
  assert.equal(new Set(cs.map((item) => item.id)).size, cs.length);
  assert.ok(
    cs.every((item) => !item.cachedCode!.includes("TraceSimulation")),
    "The learner-facing CS library must not route to legacy trace/table demos",
  );
});

test("legacy CS demonstrations remain available only as fixture coverage", () => {
  assert.equal(
    DEMONSTRATION_LIBRARY_DATA.find(
      (c) => c.id === "cs",
    )!.subcategories.flatMap((s) => s.items).length,
    56,
  );
});
