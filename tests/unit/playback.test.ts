import { describe, expect, it } from "vitest";
import {
  bubbleSort,
  insertionSort,
} from "../../src/algorithms/sorting/algorithms";
import { sortingReducer } from "../../src/algorithms/sorting/reducer";
import { createPlayback, type Scheduler } from "../../src/core/playback";

function setup() {
  let callback: ((time: number) => void) | undefined;
  const scheduler: Scheduler = {
    request(cb) {
      callback = cb;
      return 1;
    },
    cancel() {
      callback = undefined;
    },
  };
  const trace = insertionSort([3, 1, 2]).trace;
  return {
    controller: createPlayback(trace, sortingReducer, scheduler),
    trace,
    tick(time: number) {
      const next = callback;
      callback = undefined;
      next?.(time);
    },
    scheduled: () => !!callback,
  };
}

describe("playback", () => {
  it("steps backward and forward restoring all state, and respects boundaries", () => {
    const { controller: c, trace } = setup();
    c.stepBackward();
    expect(c.getSnapshot().cursor).toBe(0);
    c.stepForward();
    const first = c.getSnapshot().state;
    c.stepForward();
    c.stepBackward();
    expect(c.getSnapshot().state).toEqual(first);
    c.seek(trace.steps.length);
    expect(c.getSnapshot().status).toBe("finished");
    c.stepForward();
    expect(c.getSnapshot().cursor).toBe(trace.steps.length);
    c.seek(0);
    expect(c.getSnapshot().state).toEqual(trace.initialState);
    c.seek(5);
    c.reset();
    expect(c.getSnapshot().state).toEqual(trace.initialState);
  });
  it("plays at the selected speed, pauses, and cancels playback on manual steps", () => {
    const { controller: c, tick, scheduled } = setup();
    c.setSpeed(10);
    c.play();
    c.play();
    tick(0);
    tick(100);
    expect(c.getSnapshot().cursor).toBe(1);
    c.pause();
    tick(1000);
    expect(c.getSnapshot().cursor).toBe(1);
    expect(scheduled()).toBe(false);
    c.play();
    tick(1100);
    c.stepBackward();
    expect(scheduled()).toBe(false);
    expect(c.getSnapshot().cursor).toBe(0);
  });
  it("finishes automatically and does not restart until reset", () => {
    const { controller: c, trace, tick, scheduled } = setup();
    c.seek(trace.steps.length - 1);
    c.setSpeed(10);
    c.play();
    tick(0);
    tick(100);
    expect(c.getSnapshot().status).toBe("finished");
    expect(scheduled()).toBe(false);
    c.play();
    expect(scheduled()).toBe(false);
    c.reset();
    c.play();
    expect(scheduled()).toBe(true);
  });
  it("disposes scheduled work and subscriptions", () => {
    const { controller: c, tick, scheduled } = setup();
    let calls = 0;
    c.subscribe(() => calls++);
    c.play();
    const before = calls;
    c.dispose();
    tick(1000);
    c.reset();
    c.stepForward();
    c.play();
    expect(calls).toBe(before);
    expect(scheduled()).toBe(false);
  });
  it("rejects invalid seeking and speed", () => {
    const { controller: c } = setup();
    for (const value of [-1, 0.5, NaN, 9999])
      expect(() => c.seek(value)).toThrow(RangeError);
    for (const value of [0, -1, NaN, 61])
      expect(() => c.setSpeed(value)).toThrow(RangeError);
  });
  it("empty arrays still expose a reversible completion step", () => {
    const c = createPlayback(bubbleSort([]).trace, sortingReducer, {
      request: () => 0,
      cancel: () => {},
    });
    c.stepForward();
    expect(c.getSnapshot().state.completed).toBe(true);
    c.stepBackward();
    expect(c.getSnapshot().state.completed).toBe(false);
  });
});
