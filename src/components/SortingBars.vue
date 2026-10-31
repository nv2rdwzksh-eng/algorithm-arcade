<script setup lang="ts">
import { computed } from "vue";
import type { SortingState } from "../algorithms/sorting/types";

const props = defineProps<{ state: SortingState }>();
const max = computed(() =>
  Math.max(1, ...props.state.items.map((item) => item.value)),
);
const slot = computed(() => 880 / Math.max(1, props.state.items.length));
function kind(index: number) {
  if (props.state.modified.includes(index)) return "modified";
  if (props.state.comparing.includes(index)) return "comparing";
  if (props.state.sortedIndices.includes(index)) return "sorted";
  return "unsorted";
}
</script>

<template>
  <svg
    class="bar-chart"
    viewBox="0 0 960 370"
    role="img"
    aria-labelledby="chart-title chart-description"
  >
    <title id="chart-title">Sorting array</title>
    <desc id="chart-description">
      {{ state.items.map((item) => item.value).join(", ") }}. Amber bars are
      compared, coral bars are modified, green bars are sorted.
    </desc>
    <g class="chart-guides" aria-hidden="true">
      <line
        v-for="level in [0, 1, 2, 3]"
        :key="level"
        x1="40"
        x2="920"
        :y1="50 + level * 90"
        :y2="50 + level * 90"
      />
    </g>
    <g
      v-for="(item, index) in state.items"
      :key="index"
      class="bar-slot"
      :data-value="item.value"
      :data-state="kind(index)"
    >
      <rect
        :class="['bar', kind(index)]"
        :x="40 + index * slot + 3"
        :y="320 - (item.value / max) * 250"
        :width="Math.max(2, slot - 6)"
        :height="(item.value / max) * 250"
        rx="3"
      />
      <text
        v-if="state.items.length <= 24"
        class="bar-value"
        :x="40 + (index + 0.5) * slot"
        :y="307 - (item.value / max) * 250"
        text-anchor="middle"
      >
        {{ item.value }}
      </text>
      <text
        v-if="state.items.length <= 24"
        class="bar-index"
        :x="40 + (index + 0.5) * slot"
        y="349"
        text-anchor="middle"
      >
        {{ index }}
      </text>
      <path
        v-if="state.comparing.includes(index)"
        class="comparison-marker"
        :d="`M ${40 + (index + 0.5) * slot - 4} 365 l 4 -5 l 4 5`"
      />
      <circle
        v-if="state.modified.includes(index)"
        class="modified-marker"
        :cx="40 + (index + 0.5) * slot"
        cy="360"
        r="3"
      />
    </g>
    <text
      v-if="state.items.length === 0"
      x="480"
      y="185"
      text-anchor="middle"
      class="empty-chart"
    >
      An empty array is already in order.
    </text>
  </svg>
</template>
