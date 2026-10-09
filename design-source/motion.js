// Shared scroll-reveal motion for Pitchvilla subpages (matches home page easing).
window.PVMotion = function setup() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = s => Array.from(document.querySelectorAll(s));
  const EASE = 'cubic-bezier(.22,.61,.36,1)';
  const pending = [];

  q('[data-mark]').forEach(el => {
    const h = el.style.backgroundSize.split(' ')[1] || '0.1em';
    if (reduce) { el.style.backgroundSize = '100% ' + h; return; }
    el.style.backgroundSize = '0% ' + h;
    el.style.transition = `background-size 1s cubic-bezier(.45,0,.2,1) ${el.dataset.markDelay || '.3'}s`;
    pending.push({ el, t: 0.85, go: () => { el.style.backgroundSize = '100% ' + h; } });
  });
  if (reduce) return () => {};

  q('[data-line]').forEach((el, i) => {
    el.style.opacity = '0'; el.style.transform = 'translateY(28px)';
    el.style.transition = `transform .9s ${EASE} ${0.1 + i * 0.1}s, opacity .7s ease ${0.1 + i * 0.1}s`;
    el.getBoundingClientRect();
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, 40);
  });

  const soft = (el, delay) => {
    el.style.opacity = '0'; el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity .6s ease ${delay}s, transform .9s ${EASE} ${delay}s`;
    pending.push({ el, t: 0.95, go: () => { el.style.opacity = '1'; el.style.transform = 'none'; } });
  };
  q('h2, [data-soft]').filter(el => !el.closest('[data-line]')).forEach(el => soft(el, 0));
  q('[data-stagger]').forEach(p => Array.from(p.children).forEach((c, i) => soft(c, Math.min(i, 6) * 0.06)));

  q('[data-zoom]').forEach(el => {
    el.style.clipPath = 'inset(14% 0 0 0)'; el.style.transform = 'scale(1.04)';
    el.style.transition = `clip-path 1s ${EASE}, transform 1.2s ${EASE}`;
    pending.push({ el, t: 0.92, go: () => { el.style.clipPath = 'inset(0 0 0 0)'; el.style.transform = 'none'; } });
  });

  q('[data-count]').forEach(el => {
    const raw = el.textContent.trim(), m = raw.match(/^(\d+)(.*)$/);
    if (!m) return;
    const end = +m[1], suf = m[2];
    el.textContent = '0' + suf;
    pending.push({ el, t: 0.92, go: () => {
      const t0 = performance.now();
      const tick = t => { const p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suf; if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    } });
  });

  let list = pending;
  const check = () => {
    const vh = window.innerHeight;
    list = list.filter(p => {
      if (!p.el.isConnected) return false;
      const r = p.el.getBoundingClientRect();
      if (r.top < vh * p.t && r.bottom > 0) { p.go(); return false; }
      return true;
    });
  };
  window.addEventListener('scroll', check, { passive: true });
  const iv = setInterval(check, 400);
  setTimeout(check, 80);
  return () => { window.removeEventListener('scroll', check); clearInterval(iv); };
};
