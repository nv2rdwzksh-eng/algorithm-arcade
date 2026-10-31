import type { ExecutionTrace, ReversibleReducer } from "./types";

export interface Scheduler {
  request(callback: (time: number) => void): number;
  cancel(handle: number): void;
}
export type PlaybackStatus = "ready" | "playing" | "paused" | "finished";
export interface PlaybackSnapshot<S> {
  readonly state: S;
  readonly cursor: number;
  readonly totalSteps: number;
  readonly status: PlaybackStatus;
  readonly stepsPerSecond: number;
}

export function createPlayback<S, E, U>(
  trace: ExecutionTrace<S, E>,
  reducer: ReversibleReducer<S, E, U>,
  scheduler: Scheduler,
) {
  let state = trace.initialState;
  let cursor = 0;
  let status: PlaybackStatus = "ready";
  let speed = 4;
  let handle: number | null = null;
  let lastTime: number | null = null;
  let elapsed = 0;
  let disposed = false;
  const undo: U[] = [];
  const listeners = new Set<(snapshot: PlaybackSnapshot<S>) => void>();
  const getSnapshot = (): PlaybackSnapshot<S> => ({
    state,
    cursor,
    totalSteps: trace.steps.length,
    status,
    stepsPerSecond: speed,
  });
  const publish = () => {
    if (!disposed) for (const listener of listeners) listener(getSnapshot());
  };
  function cancel() {
    if (handle !== null) scheduler.cancel(handle);
    handle = null;
    lastTime = null;
    elapsed = 0;
  }
  function advance() {
    if (cursor >= trace.steps.length) return;
    const result = reducer.apply(state, trace.steps[cursor]);
    state = result.state;
    undo[cursor] = result.undo;
    cursor++;
  }
  function tick(time: number) {
    handle = null;
    if (disposed || status !== "playing") return;
    // Limit catch-up after a background tab resumes.
    if (lastTime !== null) elapsed += Math.min(time - lastTime, 250);
    lastTime = time;
    const interval = 1000 / speed;
    const previousCursor = cursor;
    while (elapsed >= interval && cursor < trace.steps.length) {
      advance();
      elapsed -= interval;
    }
    if (cursor === trace.steps.length) {
      status = "finished";
      cancel();
    } else handle = scheduler.request(tick);
    if (cursor !== previousCursor) publish();
  }
  return {
    getSnapshot,
    subscribe(listener: (snapshot: PlaybackSnapshot<S>) => void) {
      if (!disposed) listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    play() {
      if (disposed || status === "playing" || cursor === trace.steps.length)
        return;
      status = "playing";
      cancel();
      handle = scheduler.request(tick);
      publish();
    },
    pause() {
      if (disposed) return;
      cancel();
      status =
        cursor === trace.steps.length
          ? "finished"
          : cursor === 0
            ? "ready"
            : "paused";
      publish();
    },
    stepForward() {
      if (disposed) return;
      cancel();
      advance();
      status = cursor === trace.steps.length ? "finished" : "paused";
      publish();
    },
    stepBackward() {
      if (disposed) return;
      cancel();
      if (cursor > 0) {
        cursor--;
        state = reducer.revert(state, undo[cursor]);
        undo.length = cursor;
      }
      status = cursor === 0 ? "ready" : "paused";
      publish();
    },
    seek(target: number) {
      if (
        !Number.isInteger(target) ||
        target < 0 ||
        target > trace.steps.length
      )
        throw new RangeError("Invalid step.");
      if (disposed) return;
      cancel();
      while (cursor > target) {
        cursor--;
        state = reducer.revert(state, undo[cursor]);
      }
      undo.length = cursor;
      while (cursor < target) advance();
      status =
        cursor === trace.steps.length
          ? "finished"
          : cursor === 0
            ? "ready"
            : "paused";
      publish();
    },
    reset() {
      if (disposed) return;
      cancel();
      cursor = 0;
      undo.length = 0;
      state = trace.initialState;
      status = "ready";
      publish();
    },
    setSpeed(value: number) {
      if (!Number.isFinite(value) || value < 0.5 || value > 60)
        throw new RangeError("Speed must be 0.5–60 steps per second.");
      if (disposed) return;
      speed = value;
      elapsed = 0;
      publish();
    },
    dispose() {
      cancel();
      disposed = true;
      listeners.clear();
    },
  };
}
