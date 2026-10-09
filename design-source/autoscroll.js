(function () {
  if (window.__pvAuto) return; window.__pvAuto = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = new WeakMap();
  const tick = () => {
    document.querySelectorAll('[data-auto]').forEach(el => {
      if (el.scrollWidth <= el.clientWidth + 2) return;
      let s = state.get(el);
      if (!s) {
        s = { paused: 0, x: el.scrollLeft };
        const hold = () => { s.paused = performance.now() + 2500; };
        ['pointerdown', 'touchstart', 'wheel', 'mouseenter'].forEach(e => el.addEventListener(e, hold, { passive: true }));
        el.addEventListener('scroll', () => { if (performance.now() < s.paused) s.x = el.scrollLeft; }, { passive: true });
        state.set(el, s);
      }
      if (reduce || performance.now() < s.paused) return;
      s.x += 0.6;
      if (s.x >= el.scrollWidth - el.clientWidth) s.x = 0;
      el.scrollLeft = s.x;
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
