<template>
  <RouterView />
</template>

<style>
* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  background: #eef6ff;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  color: #102033;
  background:
    radial-gradient(circle at 12% 10%, rgba(96, 165, 250, 0.24), transparent 30%),
    linear-gradient(135deg, #f7fbff 0%, #eef6ff 48%, #eaf2ff 100%);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input {
  font: inherit;
}

#app {
  min-height: 100vh;
}
</style>
