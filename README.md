# Algorithm Arcade

An interactive algorithm visualizer. This first slice implements Bubble Sort and shift/write Insertion Sort.

## Run

Requires Node.js 22.12+ (or a newer supported release).

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. Use `npm run build` for a production build and `npm run preview` to serve it.

## Verify

```sh
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

To use an installed Microsoft Edge instead of downloading Chromium, set `PLAYWRIGHT_CHANNEL=msedge` before running E2E tests (PowerShell: `$env:PLAYWRIGHT_CHANNEL = 'msedge'`).

## Review increments

1. **Algorithms:** `src/algorithms/sorting/types.ts` and `algorithms.ts` define deterministic traces and pure sorting functions. Inputs are copied, finite numbers are supported, duplicate ordering is stable. No Vue imports.
2. **Reversal and playback:** `reducer.ts` records overwritten slots and prior metadata; `src/core/playback.ts` controls the cursor and uses an injectable scheduler. Unit tests cover algorithms, exact reversal, statistics, and scheduling.
3. **Interface:** `src/composables/useSortingPlayback.ts` bridges the engine into shallow Vue state. `SortingBars.vue` renders position slots; copied item IDs during insertion shifts never become duplicate Vue keys. `App.vue` owns input and controls. Playwright exercises both desktop and mobile.

## Semantics

- Cursor = number of applied execution steps. Cursor zero is the original array.
- Each step is atomic and can contain several events. Key placement and key release occur together.
- Comparisons count value comparisons, swaps count exchanges, writes count array assignments. A swap counts as two writes; holding a key is not an array write.
- Insertion sort displays its held key separately. A comparison highlights the candidate bar and held key; its explanation names both values. A shift can temporarily duplicate an item in two slots.
- Green means an element is at its final position. Insertion's evolving ordered prefix is not marked final.
- Previous, Next, seeking, and reset pause playback. Changing array or algorithm creates a fresh trace and retains speed. Play at completion requires Reset or a backward step.
- UI arrays are bounded to 0–40 positive integers (1–99). The algorithm engine also accepts negative and fractional finite numbers independently.
- Full traces are precomputed. Undo storage holds slot deltas rather than full array snapshots. Seeking is linear; workers and checkpoints can be added for larger future labs.
- The displayed O(1) extra space describes the sorting algorithm, excluding instrumentation, traces, and playback state.

Pathfinding and Dynamic Programming remain planned modules. No backend, routing, state-management library, or deployment is required for this slice. Google Fonts are optional; local sans-serif fallbacks work offline.
