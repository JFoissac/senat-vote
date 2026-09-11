<script setup>
import { computed } from "vue";
import { n } from "../format.js";

const props = defineProps({ groups: { type: Array, default: () => [] } });

const sorted = computed(() =>
  props.groups.slice().sort((a, b) => (b.size || 0) - (a.size || 0))
);

function size(g) {
  return g.size || (g.pour + g.contre + g.abstention + g.nonVotants);
}

function w(g, v) {
  const s = size(g);
  return s ? (100 * v) / s : 0;
}

function exp(g) {
  return g.pour + g.contre;
}

function barLabel(g) {
  return (
    (g.short || g.key) +
    " : " +
    n(g.pour) +
    " pour, " +
    n(g.contre) +
    " contre, " +
    n(g.abstention) +
    " abstentions, " +
    n(g.nonVotants) +
    " non-votants"
  );
}
</script>

<template>
  <div v-for="g in sorted" :key="g.key" class="gbar">
    <span class="gbar__tag"><span class="gbar__dot" :style="{ background: g.color }"></span>{{ g.short }}</span>
    <div class="gbar__stack" role="img" :aria-label="barLabel(g)">
      <span v-if="g.pour" class="gbar__seg gbar__seg--pour" :style="{ width: w(g, g.pour) + '%' }"></span>
      <span v-if="g.contre" class="gbar__seg gbar__seg--contre" :style="{ width: w(g, g.contre) + '%' }"></span>
      <span v-if="g.abstention" class="gbar__seg gbar__seg--abs" :style="{ width: w(g, g.abstention) + '%' }"></span>
      <span v-if="g.nonVotants" class="gbar__seg gbar__seg--nv" :style="{ width: w(g, g.nonVotants) + '%' }"></span>
    </div>
    <div class="gbar__counts">
      <span class="p"><b>{{ n(g.pour) }}</b> P</span>
      <span class="c"><b>{{ n(g.contre) }}</b> C</span>
      <span><b>{{ n(g.abstention) }}</b> A</span>
      <span><b>{{ n(g.nonVotants) }}</b> NV</span>
      <span v-if="exp(g)">{{ Math.round((100 * g.pour) / exp(g)) }} % P</span>
    </div>
  </div>
</template>
