import { describe, expect, it } from "vitest";
import {
  bubbleSort,
  insertionSort,
} from "../../src/algorithms/sorting/algorithms";
import {
  sortingReducer,
  type SortingUndo,
} from "../../src/algorithms/sorting/reducer";

for (const algorithm of [bubbleSort, insertionSort]) {
  describe(algorithm.name, () => {
    it.each([
      [],
      [7],
      [3, 1, 3, 2, 1],
      [1, 2, 3, 4],
      [5, 4, 3, 2, 1],
      [-2, 0, -7, 4],
      [2, 2, 2],
    ])(
      "sorts %j deterministically without changing input",
      (...values: number[]) => {
        const input = Object.freeze([...values]);
        const result = algorithm(input);
        expect(result.output).toEqual([...input].sort((a, b) => a - b));
        expect(result).toEqual(algorithm(input));
        expect(input).toEqual(values);
        let state = result.trace.initialState;
        const history: SortingUndo[] = [];
        for (const step of result.trace.steps) {
          const before = structuredClone(state);
          const next = sortingReducer.apply(state, step);
          expect(state).toEqual(before);
          expect(sortingReducer.revert(next.state, next.undo)).toEqual(before);
          history.push(next.undo);
          state = next.state;
        }
        expect(state.items.map((item) => item.value)).toEqual(result.output);
        expect(state.completed).toBe(true);
        // Strict > preserves the input order of equal items in both algorithms.
        for (const value of new Set(input)) {
          expect(
            state.items
              .filter((item) => item.value === value)
              .map((item) => item.id),
          ).toEqual(
            result.trace.initialState.items
              .filter((item) => item.value === value)
              .map((item) => item.id),
          );
        }
        for (const undo of history.reverse())
          state = sortingReducer.revert(state, undo);
        expect(state).toEqual(result.trace.initialState);
      },
    );
    it("rejects non-finite values", () => {
      expect(() => algorithm([NaN])).toThrow();
      expect(() => algorithm([Infinity])).toThrow();
    });
  });
}

it("counts bubble comparisons, swaps, and array writes", () => {
  const { trace } = bubbleSort([3, 2, 1]);
  const final = trace.steps.reduce(
    (state, step) => sortingReducer.apply(state, step).state,
    trace.initialState,
  );
  expect([final.comparisons, final.swaps, final.writes]).toEqual([3, 3, 6]);
});

it("insertion sort shifts and places the held key using writes, without swaps", () => {
  const { trace } = insertionSort([3, 2, 1]);
  expect(
    trace.steps
      .flatMap((step) => step.events)
      .some((event) => event.type === "swap"),
  ).toBe(false);
  const final = trace.steps.reduce(
    (state, step) => sortingReducer.apply(state, step).state,
    trace.initialState,
  );
  expect([final.comparisons, final.swaps, final.writes]).toEqual([3, 0, 5]);
});
