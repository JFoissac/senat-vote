<script setup>
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, required: true },
  pages: { type: Number, required: true }
});

const emit = defineEmits(["update:page"]);

const canPrev = computed(() => props.page > 1);
const canNext = computed(() => props.page < props.pages);
</script>

<template>
  <div class="pager" role="navigation" aria-label="Pagination">
    <button
      class="btn btn--small"
      type="button"
      :disabled="!canPrev"
      @click="emit('update:page', page - 1)"
    >
      ← Précédent
    </button>
    <span aria-live="polite">Page {{ page }} / {{ pages }}</span>
    <button
      class="btn btn--small"
      type="button"
      :disabled="!canNext"
      @click="emit('update:page', page + 1)"
    >
      Suivant →
    </button>
  </div>
</template>
