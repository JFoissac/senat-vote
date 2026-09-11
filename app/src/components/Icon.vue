<script setup>
defineProps({ name: { type: String, default: "" } });
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'euro'">
      <path d="M17.5 8.6A6.5 6.5 0 1 0 17.5 15.4" />
      <path d="M5.5 11h8.5M5.5 13.5h8" />
    </template>
    <template v-else-if="name === 'heart'">
      <path d="M12 20s-7.3-4.4-9.2-8.2A5 5 0 0 1 12 6.6a5 5 0 0 1 9.2 5.2C19.3 15.6 12 20 12 20z" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 0-2 2z" />
      <path d="M20 5.5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z" />
    </template>
    <template v-else-if="name === 'home'">
      <path d="m4 11 8-6.5L20 11" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </template>
    <template v-else-if="name === 'briefcase'">
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 12h17" />
    </template>
    <template v-else-if="name === 'leaf'">
      <path d="M5 19C5 10 11.5 5.2 20 4.5 19 13.5 15 19.5 6.5 19.5z" />
      <path d="M5 19c3.2-5.2 7.2-8.2 11-9.5" />
    </template>
    <template v-else-if="name === 'wheat'">
      <path d="M12 21V9" />
      <path d="M12 9c-2.5 0-3.5-2-3.5-4.5C11 4.5 12 6.5 12 9zM12 9c2.5 0 3.5-2 3.5-4.5C13 4.5 12 6.5 12 9z" />
      <path d="M12 15c-2.5 0-3.5-2-3.5-4.5 2.5 0 3.5 2 3.5 4.5zM12 15c2.5 0 3.5-2 3.5-4.5-2.5 0-3.5 2-3.5 4.5z" />
    </template>
    <template v-else-if="name === 'users'">
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19.5c0-2.2-.7-3.9-2-5" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 3.5 19 6.2v5.1c0 4.8-3.4 7.9-7 9.7-3.6-1.8-7-4.9-7-9.7V6.2z" />
      <path d="m9 12 2.1 2.1L15.5 9.5" />
    </template>
    <template v-else-if="name === 'globe'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.8 3.4 2.8 13.6 0 17-2.8-3.4-2.8-13.6 0-17z" />
    </template>
    <template v-else>
      <path d="M12 4.5v15M6 8.5h12M8.5 19.5h7" />
      <path d="m6 8.5-2.5 5h5zM18 8.5l-2.5 5h5z" />
    </template>
  </svg>
</template>
