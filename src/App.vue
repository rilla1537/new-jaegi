<template>
  <div id="app-layout">
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
#app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex-grow: 1;
  padding: 20px;
}
</style>
