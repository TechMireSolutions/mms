(function() {
  try {
    window.__zod_globalConfig = Object.assign(window.__zod_globalConfig || {}, { jitless: true });
    var d = document.documentElement;
    var raw = localStorage.getItem('mms_global_settings') || localStorage.getItem('globalSettings');
    var theme = raw ? JSON.parse(raw).theme : null;
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      d.classList.add('dark');
      d.style.colorScheme = 'dark';
    } else {
      d.classList.remove('dark');
      d.style.colorScheme = 'light';
    }
  } catch (_) {}
})();
