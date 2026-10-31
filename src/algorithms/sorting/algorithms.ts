import type { ExecutionStep } from "../../core/types";
import type {
  SortingAlgorithm,
  SortingEvent,
  SortingResult,
  SortItem,
  SortingState,
} from "./types";

function prepare(input: readonly number[]) {
  if (input.some((value) => !Number.isFinite(value)))
    throw new Error("Array values must be finite numbers.");
  const items: SortItem[] = input.map((value, index) => ({
    id: `item-${index}`,
    value,
  }));
  const initialState: SortingState = {
    items: [...items],
    comparing: [],
    modified: [],
    sortedIndices: [],
    held: null,
    comparisons: 0,
    swaps: 0,
    writes: 0,
    completed: false,
  };
  const steps: ExecutionStep<SortingEvent>[] = [];
  const emit = (explanation: string, ...events: SortingEvent[]) =>
    steps.push({ explanation, events });
  return { items, initialState, steps, emit };
}

export function bubbleSort(input: readonly number[]): SortingResult {
  const { items, initialState, steps, emit } = prepare(input);
  for (let end = items.length - 1; end > 0; end--) {
    let changed = false;
    for (let j = 0; j < end; j++) {
      emit(`Compare ${items[j].value} and ${items[j + 1].value}.`, {
        type: "compare",
        indices: [j, j + 1],
      });
      if (items[j].value > items[j + 1].value) {
        emit(`Swap ${items[j].value} and ${items[j + 1].value}.`, {
          type: "swap",
          indices: [j, j + 1],
        });
        [items[j], items[j + 1]] = [items[j + 1], items[j]];
        changed = true;
      }
    }
    emit(`Position ${end} is in its final place.`, {
      type: "markSorted",
      indices: [end],
    });
    if (!changed) break;
  }
  emit("Every element is in order. Sorting complete.", { type: "complete" });
  return {
    algorithm: "bubble",
    output: items.map((item) => item.value),
    trace: { initialState, steps },
  };
}

export function insertionSort(input: readonly number[]): SortingResult {
  const { items, initialState, steps, emit } = prepare(input);
  for (let i = 1; i < items.length; i++) {
    const key = items[i];
    emit(`Hold ${key.value} while finding its place.`, {
      type: "hold",
      item: key,
    });
    let j = i - 1;
    while (j >= 0) {
      emit(`Compare ${items[j].value} with held key ${key.value}.`, {
        type: "compare",
        indices: [j, j + 1],
        held: key,
      });
      if (items[j].value <= key.value) break;
      emit(`Shift ${items[j].value} from position ${j} to ${j + 1}.`, {
        type: "write",
        index: j + 1,
        item: items[j],
      });
      items[j + 1] = items[j];
      j--;
    }
    items[j + 1] = key;
    emit(
      `Write held key ${key.value} into position ${j + 1}.`,
      { type: "write", index: j + 1, item: key },
      { type: "release" },
    );
  }
  // A sorted prefix is not necessarily in its final positions; only mark final positions.
  emit("Every element is in order. Sorting complete.", { type: "complete" });
  return {
    algorithm: "insertion",
    output: items.map((item) => item.value),
    trace: { initialState, steps },
  };
}

export function runSort(
  algorithm: SortingAlgorithm,
  input: readonly number[],
): SortingResult {
  return algorithm === "bubble" ? bubbleSort(input) : insertionSort(input);
}
