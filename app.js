<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const reg = await navigator.serviceWorker.register('./service-worker.js?v=8');
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      setTimeout(() => window.location.reload(), 100);
    });
    if (reg.update) reg.update();
  });
}

// ... keep the rest of your JavaScript logic unchanged ...
</script>
