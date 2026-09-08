import React from "react";
import { PlaygroundId } from "../simulations/playgroundCatalog";
import {
  BitTray,
  LogicBench,
  EncodingBench,
  CollectionBench,
  MemoryBench,
  HashBench,
  CacheBench,
} from "./playground/Objects";
import {
  ThreadBench,
  DeadlockBench,
  PacketBench,
  QuorumBench,
  TransactionBench,
} from "./playground/Systems";
import {
  GraphBench,
  SortingBench,
  HanoiBench,
  GradientBench,
} from "./playground/Algorithms";
import { JoinBench, AutomatonBench, CryptoBench } from "./playground/Decisions";
import { BasesBench, ParityBench, CompressionBench, PixelsBench, ArrayBench, LinkedBench, UnionFindBench, HeapBench, TreeBench, GarbageBench, PagingBench } from "./playground/ExpandedFoundations";
import { BinarySearchBench, MazeBench, ShortestPathBench, RecursionBench, DynamicBench, KnapsackBench, StringMatchBench } from "./playground/ExpandedAlgorithms";
import { PipelineBench, SchedulerBench, FileSystemBench, BranchBench, DnsBench, LoadBalanceBench, TcpBench } from "./playground/ExpandedSystems";
import { BTreeBench, QueryPlanBench, DecisionTreeBench, NeuralNetBench, ReinforcementBench, AccessBench } from "./playground/ExpandedDecisions";
const materials: Record<PlaygroundId, React.ComponentType> = {
  bits: BitTray,
  gates: LogicBench,
  encoding: EncodingBench,
  bases: BasesBench,
  parity: ParityBench,
  compression: CompressionBench,
  pixels: PixelsBench,
  collections: CollectionBench,
  memory: MemoryBench,
  hash: HashBench,
  cache: CacheBench,
  arrays: ArrayBench,
  linked: LinkedBench,
  unionfind: UnionFindBench,
  heap: HeapBench,
  tree: TreeBench,
  gc: GarbageBench,
  paging: PagingBench,
  threads: ThreadBench,
  deadlock: DeadlockBench,
  packets: PacketBench,
  quorum: QuorumBench,
  pipeline: PipelineBench,
  scheduler: SchedulerBench,
  filesystem: FileSystemBench,
  branch: BranchBench,
  dns: DnsBench,
  loadbalance: LoadBalanceBench,
  tcp: TcpBench,
  transactions: TransactionBench,
  graph: GraphBench,
  sorting: SortingBench,
  hanoi: HanoiBench,
  binarysearch: BinarySearchBench,
  maze: MazeBench,
  shortest: ShortestPathBench,
  recursion: RecursionBench,
  dynamic: DynamicBench,
  knapsack: KnapsackBench,
  stringmatch: StringMatchBench,
  gradient: GradientBench,
  joins: JoinBench,
  automaton: AutomatonBench,
  btree: BTreeBench,
  queryplan: QueryPlanBench,
  decisiontree: DecisionTreeBench,
  neuralnet: NeuralNetBench,
  reinforcement: ReinforcementBench,
  access: AccessBench,
  crypto: CryptoBench,
};
export function PlaygroundSimulation({ id }: { id: PlaygroundId }) {
  const Material = materials[id];
  if (!Material) throw new Error(`Unknown playground: ${id}`);
  return <Material key={id} />;
}
