<script setup>
import { n } from "../format.js";

defineProps({ totals: { type: Object, required: true } });
</script>

<template>
  <div class="totals">
    <span class="tot tot--pour"><b>{{ n(totals.pour) }}</b> pour</span>
    <span class="tot tot--contre"><b>{{ n(totals.contre) }}</b> contre</span>
    <span v-if="totals.abstention != null" class="tot"><b>{{ n(totals.abstention) }}</b> abst.</span>
    <span v-if="totals.nonVotants != null" class="tot"><b>{{ n(totals.nonVotants) }}</b> non-votants</span>
    <span v-if="totals.votants != null" class="tot">{{ n(totals.votants) }} votants</span>
  </div>
</template>
