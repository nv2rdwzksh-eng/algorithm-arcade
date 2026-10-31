import type { ReversibleReducer } from "../../core/types";
import type { SortItem, SortingEvent, SortingState } from "./types";

// Keep old metadata and only overwritten slots, rather than an array snapshot per step.
export interface SortingUndo {
  readonly metadata: Omit<SortingState, "items">;
  readonly slots: readonly (readonly [number, SortItem])[];
}

export const sortingReducer: ReversibleReducer<
  SortingState,
  SortingEvent,
  SortingUndo
> = {
  apply(previous, step) {
    const { items: oldItems, ...metadata } = previous;
    const items = [...oldItems];
    const slots = new Map<number, SortItem>();
    const remember = (index: number) => {
      if (!slots.has(index)) slots.set(index, oldItems[index]);
    };
    let state: SortingState = {
      ...previous,
      items,
      comparing: [],
      modified: [],
    };
    for (const event of step.events) {
      switch (event.type) {
        case "compare":
          state = {
            ...state,
            comparing: event.held ? [event.indices[0]] : event.indices,
            comparisons: state.comparisons + 1,
          };
          break;
        case "swap": {
          const [a, b] = event.indices;
          remember(a);
          remember(b);
          [items[a], items[b]] = [items[b], items[a]];
          state = {
            ...state,
            modified: [a, b],
            swaps: state.swaps + 1,
            writes: state.writes + 2,
          };
          break;
        }
        case "write":
          remember(event.index);
          items[event.index] = event.item;
          state = {
            ...state,
            modified: [event.index],
            writes: state.writes + 1,
          };
          break;
        case "hold":
          state = { ...state, held: event.item };
          break;
        case "release":
          state = { ...state, held: null };
          break;
        case "markSorted":
          state = {
            ...state,
            sortedIndices: [
              ...new Set([...state.sortedIndices, ...event.indices]),
            ],
          };
          break;
        case "complete":
          state = {
            ...state,
            completed: true,
            held: null,
            sortedIndices: items.map((_, i) => i),
          };
          break;
        default: {
          const exhaustive: never = event;
          throw new Error(`Unknown event: ${exhaustive}`);
        }
      }
    }
    return { state, undo: { metadata, slots: [...slots] } };
  },
  revert(state, undo) {
    const items = [...state.items];
    for (const [index, item] of undo.slots) items[index] = item;
    return { ...undo.metadata, items };
  },
};
