<script setup>
defineProps({ rows: { type: Array, default: () => [] } });

const yLabels = [100, 75, 50, 25];

function rowLabel(r) {
  return (
    r.label +
    " : " +
    r.pctPour +
    " % pour, " +
    r.pctContre +
    " % contre, " +
    r.pctAbs +
    " % abstention"
  );
}
</script>

<template>
  <template v-if="rows.length">
    <div class="chart">
      <div class="chart__ylabels" aria-hidden="true">
        <span v-for="v in yLabels" :key="v" :style="{ top: 100 - v + '%' }">{{ v }}</span>
        <span style="top: 100%">0</span>
      </div>
      <div class="chart__grid" aria-hidden="true"></div>
      <div class="chart__scroll">
        <div class="chart__plot">
          <div
            v-for="r in rows"
            :key="r.key"
            class="col"
            role="img"
            :aria-label="rowLabel(r)"
            :style="{ '--c': r.color }"
            :title="r.label + ' : ' + r.pctPour + ' % pour, ' + r.pctContre + ' % contre, ' + r.pctAbs + ' % abstention'"
          >
            <div class="col__stack">
              <div
                v-if="r.pctContre > 0"
                class="col__seg col__seg--unfav"
                :style="{ height: r.pctContre + '%' }"
              >
                <span v-if="r.pctContre === Math.max(r.pctPour, r.pctContre, r.pctAbs) && r.pctContre >= 14" class="col__pct">{{ r.pctContre }} %</span>
              </div>
              <div
                v-if="r.pctAbs > 0"
                class="col__seg col__seg--abs"
                :style="{ height: r.pctAbs + '%' }"
              >
                <span v-if="r.pctAbs === Math.max(r.pctPour, r.pctContre, r.pctAbs) && r.pctAbs >= 14" class="col__pct">{{ r.pctAbs }} %</span>
              </div>
              <div
                v-if="r.pctPour > 0"
                class="col__seg col__seg--fav"
                :style="{ height: r.pctPour + '%' }"
              >
                <span v-if="r.pctPour === Math.max(r.pctPour, r.pctContre, r.pctAbs) && r.pctPour >= 14" class="col__pct">{{ r.pctPour }} %</span>
              </div>
            </div>
            <div class="col__label"><span class="col__dot"></span>{{ r.short }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="chart-legend">
      <span><i class="l-fav"></i>Ont voté pour</span>
      <span><i class="l-abs"></i>Abstention</span>
      <span><i class="l-unfav"></i>Ont voté contre</span>
    </div>
  </template>
  <p v-else class="empty">Aucune donnée pour ce graphique.</p>
</template>
