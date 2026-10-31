<script setup lang="ts">
import { computed, ref } from "vue";
import SortingBars from "./components/SortingBars.vue";
import { useSortingPlayback } from "./composables/useSortingPlayback";
import type { SortingAlgorithm } from "./algorithms/sorting/types";

const initial = [48, 23, 72, 35, 61, 18, 87, 42, 56, 29, 79, 12];
const algorithm = ref<SortingAlgorithm>("bubble");
const input = ref(initial);
const size = ref(initial.length);
const sizeDraft = ref(initial.length);
const manual = ref(initial.join(", "));
const error = ref("");
const playback = useSortingPlayback(initial, algorithm.value);
const { snapshot, explanation } = playback;
const state = computed(() => snapshot.value.state);
const info = computed(() =>
  algorithm.value === "bubble"
    ? {
        title: "Bubble Sort",
        summary: "Compare neighbors. Swap what’s out of order. Repeat.",
        detail:
          "Each pass moves the largest remaining value to its final position. If a pass makes no swaps, the array is sorted.",
        space: "O(1)",
        best: "O(n)",
      }
    : {
        title: "Insertion Sort",
        summary: "Hold a key. Shift larger values. Write it into place.",
        detail:
          "Build an ordered prefix, one key at a time. Larger values shift right until there is room for the held key. The prefix can still move in later steps.",
        space: "O(1)",
        best: "O(n)",
      },
);
const statusLabel = computed(
  () =>
    ({
      ready: "Ready to explore",
      playing: "Playing",
      paused: "Paused",
      finished: "Sorted",
    })[snapshot.value.status],
);
function replace(values: number[]) {
  input.value = values;
  size.value = values.length;
  sizeDraft.value = values.length;
  manual.value = values.join(", ");
  error.value = "";
  playback.replace(values, algorithm.value);
}
function randomize(count = size.value) {
  replace(
    Array.from({ length: count }, () => 5 + Math.floor(Math.random() * 95)),
  );
}
function selectAlgorithm() {
  playback.replace(input.value, algorithm.value);
}
function resize(event: Event) {
  randomize(Number((event.target as HTMLInputElement).value));
}
function applyInput() {
  const tokens =
    manual.value.trim() === ""
      ? []
      : manual.value.split(",").map((value) => value.trim());
  const values = tokens.map(Number);
  if (
    tokens.some((token) => token === "") ||
    values.length > 40 ||
    values.some((value) => !Number.isInteger(value) || value < 1 || value > 99)
  ) {
    error.value =
      "Use up to 40 whole numbers from 1 to 99, separated by commas. Leave blank for an empty array.";
    return;
  }
  replace(values);
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <a class="brand" href="./" aria-label="Algorithm Arcade home">
        <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true">
          <rect x="2" y="17" width="6" height="11" rx="1" />
          <rect x="12" y="9" width="6" height="19" rx="1" />
          <rect x="22" y="2" width="6" height="26" rx="1" />
        </svg>
        Algorithm Arcade
      </a>
      <nav aria-label="Labs">
        <span class="nav-current" aria-current="page">Sorting Lab</span
        ><span class="future-lab">Pathfinding <small>Coming later</small></span
        ><span class="future-lab"
          >Dynamic Programming <small>Coming later</small></span
        >
      </nav>
    </header>

    <main>
      <div class="page-intro">
        <div>
          <h1>See the sort unfold.</h1>
          <p>A little order, one operation at a time.</p>
        </div>
        <span class="lab-label">Sorting Lab</span>
      </div>
      <div class="workspace">
        <section
          class="experiment"
          :class="{
            'instant-updates':
              snapshot.stepsPerSecond >= 10 || snapshot.status !== 'playing',
          }"
          aria-label="Sorting experiment"
        >
          <div class="experiment-toolbar">
            <label class="algorithm-select"
              >Algorithm<select
                v-model="algorithm"
                aria-label="Algorithm"
                @change="selectAlgorithm"
              >
                <option value="bubble">Bubble Sort</option>
                <option value="insertion">Insertion Sort</option>
              </select></label
            >
            <label class="size-control" for="array-size"
              >Array size <output for="array-size">{{ sizeDraft }}</output
              ><input
                id="array-size"
                v-model.number="sizeDraft"
                type="range"
                min="0"
                max="40"
                @change="resize"
            /></label>
            <button class="randomize" @click="randomize()">
              <svg
                viewBox="0 0 20 20"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  d="M3 5h3l8 10h3M3 15h3l8-10h3M14 2l3 3-3 3m0 4 3 3-3 3"
                /></svg
              >Randomize
            </button>
          </div>
          <div class="chart-heading">
            <h2>{{ info.title }}</h2>
            <span class="status" :class="snapshot.status"
              ><span></span>{{ statusLabel }}</span
            >
          </div>
          <SortingBars :state="state" />
          <div class="chart-legend" aria-label="Chart legend">
            <span><i class="unsorted"></i>Unsorted</span
            ><span><i class="comparing"></i>Comparing</span
            ><span><i class="modified"></i>Modified</span
            ><span><i class="sorted"></i>Sorted</span>
          </div>

          <div class="playback-area">
            <div class="playback-buttons">
              <button
                class="icon-button"
                aria-label="Reset"
                title="Reset"
                :disabled="
                  snapshot.cursor === 0 && snapshot.status !== 'playing'
                "
                @click="playback.reset"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 7a7 7 0 1 1-1 6M4 2v5h5" />
                </svg>
              </button>
              <button
                class="icon-button"
                aria-label="Previous Step"
                title="Previous Step"
                :disabled="snapshot.cursor === 0"
                @click="playback.previous"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 4v12M15 4l-8 6 8 6z" />
                </svg>
              </button>
              <button
                class="play-button"
                :disabled="snapshot.status === 'finished'"
                @click="
                  snapshot.status === 'playing'
                    ? playback.pause()
                    : playback.play()
                "
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    v-if="snapshot.status === 'playing'"
                    d="M6 4v12M14 4v12"
                  />
                  <path v-else d="m6 3 10 7-10 7z" /></svg
                >{{ snapshot.status === "playing" ? "Pause" : "Play" }}
              </button>
              <button
                class="icon-button"
                aria-label="Next Step"
                title="Next Step"
                :disabled="snapshot.cursor === snapshot.totalSteps"
                @click="playback.next"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M15 4v12M5 4l8 6-8 6z" />
                </svg>
              </button>
            </div>
            <label class="speed-control" for="speed"
              >Speed
              <select
                id="speed"
                aria-label="Speed"
                :value="snapshot.stepsPerSecond"
                @change="
                  playback.setSpeed(
                    Number(($event.target as HTMLSelectElement).value),
                  )
                "
              >
                <option :value="1">1 step/s</option>
                <option :value="4">4 steps/s</option>
                <option :value="10">10 steps/s</option>
                <option :value="30">30 steps/s</option>
                <option :value="60">60 steps/s</option>
              </select></label
            >
          </div>
          <div class="timeline">
            <label for="timeline"
              >Execution step
              <output data-testid="step-count"
                >{{ snapshot.cursor }} / {{ snapshot.totalSteps }}</output
              ></label
            ><input
              id="timeline"
              type="range"
              min="0"
              :max="snapshot.totalSteps"
              :value="snapshot.cursor"
              @input="
                playback.seek(Number(($event.target as HTMLInputElement).value))
              "
            />
          </div>
          <dl class="statistics">
            <div>
              <dt>Comparisons</dt>
              <dd data-testid="comparisons">{{ state.comparisons }}</dd>
            </div>
            <div>
              <dt>Swaps</dt>
              <dd data-testid="swaps">{{ state.swaps }}</dd>
            </div>
            <div>
              <dt>Writes</dt>
              <dd data-testid="writes">{{ state.writes }}</dd>
            </div>
          </dl>
        </section>

        <aside class="notebook" aria-label="Algorithm notes">
          <h2>Inside the algorithm</h2>
          <p class="algorithm-summary">{{ info.summary }}</p>
          <p>{{ info.detail }}</p>
          <dl class="complexity">
            <div>
              <dt>Average time</dt>
              <dd>O(n²)</dd>
            </div>
            <div>
              <dt>Best time</dt>
              <dd>{{ info.best }}</dd>
            </div>
            <div>
              <dt title="Sorting workspace, excluding the execution trace">
                Algorithm space
              </dt>
              <dd>{{ info.space }}</dd>
            </div>
            <div>
              <dt>Stable sort</dt>
              <dd>Yes</dd>
            </div>
          </dl>
          <section class="current-operation">
            <h3>Current operation</h3>
            <p
              :aria-live="snapshot.status === 'playing' ? 'off' : 'polite'"
              data-testid="explanation"
            >
              {{ explanation }}
            </p>
            <div
              v-if="state.held"
              class="held-key"
              :class="{ 'held-comparing': state.comparing.length > 0 }"
            >
              Held key <strong>{{ state.held.value }}</strong>
            </div>
          </section>
          <p class="count-note">
            A swap counts as two writes. Insertion sort uses shifts and writes,
            with no swaps. Green marks final positions.
          </p>
        </aside>
      </div>

      <section class="input-section" aria-labelledby="input-heading">
        <div>
          <h2 id="input-heading">Try your own array</h2>
          <p>Up to 40 values, from 1 to 99. Duplicates welcome.</p>
        </div>
        <form @submit.prevent="applyInput">
          <label class="sr-only" for="manual-array">Array values</label
          ><input
            id="manual-array"
            v-model="manual"
            :aria-invalid="!!error"
            :aria-describedby="error ? 'input-error' : undefined"
            placeholder="48, 23, 72, 35"
            autocomplete="off"
          /><button type="submit">Apply array</button>
          <p v-if="error" id="input-error" class="input-error" role="alert">
            {{ error }}
          </p>
        </form>
      </section>
    </main>
    <footer>
      <span>Algorithm Arcade</span
      ><span>Take your time. Every step has a story.</span>
    </footer>
  </div>
</template>
