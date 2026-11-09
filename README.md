# Algorithm Arcade

An interactive algorithm visualizer. This first slice implements Bubble Sort and shift/write Insertion Sort.

## Run

Requires Node.js 22.12+ (or a newer supported release).

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. Use `npm run build` for a production build and `npm run preview` to serve it.

The app uses the `/algorithm-arcade/` base path in development and production. Open the URL with that suffix, such as `http://127.0.0.1:5173/algorithm-arcade/`.

## GitHub Pages deployment

Production URL: [Algorithm Arcade](https://nv2rdwzksh-eng.github.io/algorithm-arcade/).

GitHub Pages must serve the compiled `dist/` directory. Publishing the repository root serves the development `index.html`, which references `/src/main.ts` and cannot run directly on Pages. Vite's `base: "/algorithm-arcade/"` ensures compiled JavaScript and CSS URLs include the repository prefix.

### One-time repository setup and publishing

These are manual steps; adding the local configuration does not push changes or change repository settings.

1. Review and commit `vite.config.ts`, `package.json`, `scripts/verify-pages-build.mjs`, `.github/workflows/deploy-pages.yml`, and this README, then push the commit to `main`.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. Do not choose the repository root or a source branch folder for publishing.
3. Open **Actions → Deploy to GitHub Pages**. The push to `main` triggers the workflow. If it ran before the Pages source was configured, rerun it or use **Run workflow** on `main`.
4. If the `github-pages` environment requires approval, approve the deployment. Its branch rules must allow `main`.
5. Wait for the build and deployment jobs to succeed, then open the production URL above. A hard refresh can clear previously cached source HTML.

The workflow installs dependencies with `npm ci`, runs unit tests, runs the type-checked production build, verifies generated asset paths, and uploads **only `dist/`** with `upload-pages-artifact`. A separate deployment job waits for that artifact and uses `deploy-pages`. Actions are pinned to commit SHAs. Node.js 24 is used in CI.

The build has read-only repository access. Only the deployment job receives `pages: write` and `id-token: write`, with the `github-pages` environment and deployment URL. It uses GitHub's built-in token; no personal access token or `gh-pages` branch is needed. Pages deployments are serialized so active deployments are not interrupted.

### Verify the production build locally

```sh
npm ci
npm test
npm run build
npm run verify:pages
npm run preview
```

Open `http://127.0.0.1:4173/algorithm-arcade/`. The verifier checks that built HTML references compiled JS and CSS, every local asset URL starts with `/algorithm-arcade/`, each referenced file exists in `dist/`, and no `/src/` URL remains. In the browser's Network panel, compiled assets should return 200 under `/algorithm-arcade/assets/`.

If the repository name changes or a custom domain is introduced, update the Vite base path and the verifier's expected prefix together. See [Vite's Pages deployment guide](https://vite.dev/guide/static-deploy.html#github-pages) and [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

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
