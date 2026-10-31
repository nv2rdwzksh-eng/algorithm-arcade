import { computed, onScopeDispose, shallowRef } from "vue";
import { runSort } from "../algorithms/sorting/algorithms";
import { sortingReducer } from "../algorithms/sorting/reducer";
import type { SortingAlgorithm } from "../algorithms/sorting/types";
import { createPlayback } from "../core/playback";

export function useSortingPlayback(
  input: readonly number[],
  algorithm: SortingAlgorithm,
) {
  const result = shallowRef(runSort(algorithm, input));
  const scheduler = {
    request: (cb: (time: number) => void) => requestAnimationFrame(cb),
    cancel: (id: number) => cancelAnimationFrame(id),
  };
  let controller = createPlayback(
    result.value.trace,
    sortingReducer,
    scheduler,
  );
  const snapshot = shallowRef(controller.getSnapshot());
  let unsubscribe = controller.subscribe((value) => {
    snapshot.value = value;
  });
  const replace = (values: readonly number[], selected: SortingAlgorithm) => {
    const speed = snapshot.value.stepsPerSecond;
    unsubscribe();
    controller.dispose();
    result.value = runSort(selected, values);
    controller = createPlayback(result.value.trace, sortingReducer, scheduler);
    controller.setSpeed(speed);
    snapshot.value = controller.getSnapshot();
    unsubscribe = controller.subscribe((value) => {
      snapshot.value = value;
    });
  };
  onScopeDispose(() => {
    unsubscribe();
    controller.dispose();
  });
  return {
    snapshot,
    explanation: computed(
      () =>
        result.value.trace.steps[snapshot.value.cursor - 1]?.explanation ??
        "Ready when you are. Play the algorithm or explore one step at a time.",
    ),
    replace,
    play: () => controller.play(),
    pause: () => controller.pause(),
    next: () => controller.stepForward(),
    previous: () => controller.stepBackward(),
    reset: () => controller.reset(),
    seek: (step: number) => controller.seek(step),
    setSpeed: (speed: number) => controller.setSpeed(speed),
  };
}
