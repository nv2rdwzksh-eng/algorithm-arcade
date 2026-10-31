import type { ExecutionTrace } from "../../core/types";

export type SortingAlgorithm = "bubble" | "insertion";
export interface SortItem {
  readonly id: string;
  readonly value: number;
}

export type SortingEvent =
  | {
      readonly type: "compare";
      readonly indices: readonly [number, number];
      readonly held?: SortItem;
    }
  | { readonly type: "swap"; readonly indices: readonly [number, number] }
  | { readonly type: "write"; readonly index: number; readonly item: SortItem }
  | { readonly type: "hold"; readonly item: SortItem }
  | { readonly type: "release" }
  | { readonly type: "markSorted"; readonly indices: readonly number[] }
  | { readonly type: "complete" };

export interface SortingState {
  readonly items: readonly SortItem[];
  readonly comparing: readonly number[];
  readonly modified: readonly number[];
  readonly sortedIndices: readonly number[];
  readonly held: SortItem | null;
  readonly comparisons: number;
  readonly swaps: number;
  readonly writes: number;
  readonly completed: boolean;
}

export type SortingTrace = ExecutionTrace<SortingState, SortingEvent>;
export interface SortingResult {
  readonly algorithm: SortingAlgorithm;
  readonly output: readonly number[];
  readonly trace: SortingTrace;
}
