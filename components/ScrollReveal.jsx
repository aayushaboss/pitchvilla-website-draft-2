'use client';
// Site-wide fallback scroll reveal. The design files only animate some elements
// (h2, [data-soft], [data-stagger], page-specific widgets); this fades up every other
// block below the fold with the same v4 easing, so no section just pops in.
// Anything a page already animates (inline opacity/transform/clip-path or an
// opacity/transform transition) is left alone, along with its whole subtree.
import { useEffect } from 'react';

const EASE = 'cubic-bezier(.22,.61,.36,1)';

const isAnimated = el => {
  const s = el.style;
  return s.opacity !== '' || s.transform !== '' || s.clipPath !== '' || /opacity|transform|clip-path/.test(s.transition);
};
const hasAnimatedInside = el => isAnimated(el) || [...el.querySelectorAll('*')].some(isAnimated);
const visible = el => {
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
};

// Split a section into the largest blocks that contain nothing already animated.
function collect(el, out) {
  if (!visible(el) || isAnimated(el)) return;
  if (hasAnimatedInside(el)) {
    for (const c of el.children) collect(c, out);
    return;
  }
  // descend through single-child wrappers so the content moves, not the backdrop
  const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
  if (el.children.length === 1 && !ownText && el.tagName !== 'A' && el.tagName !== 'BUTTON') {
    collect(el.firstElementChild, out);
    return;
  }
  const kids = [...el.children].filter(visible);
  const d = getComputedStyle(el).display;
  // lists, grids and rows: stagger their items
  if (kids.length >= 3 && /grid|flex/.test(d)) kids.forEach((c, i) => out.push({ el: c, delay: Math.min(i, 6) * 0.06 }));
  else out.push({ el, delay: 0 });
}

export default function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const done = new WeakSet();
    let pending = [];
    const timers = [];

    const scan = () => {
      const vh = window.innerHeight;
      const tops = [...document.querySelectorAll('section, footer')].filter(s => !s.parentElement.closest('section, footer'));
      for (const sec of tops) {
        if (done.has(sec)) continue;
        const blocks = [];
        for (const c of sec.children) collect(c, blocks);
        // only blocks that start below the fold; the first screen is the page's own hero motion
        for (const b of blocks) {
          if (done.has(b.el) || b.el.getBoundingClientRect().top < vh * 0.92) continue;
          done.add(b.el);
          const s = b.el.style;
          b.saved = s.transition;
          s.opacity = '0';
          s.transform = 'translateY(24px)';
          s.transition = `opacity .6s ease ${b.delay}s, transform .9s ${EASE} ${b.delay}s`;
          pending.push(b);
        }
        done.add(sec);
      }
      check();
    };

    const check = () => {
      const vh = window.innerHeight;
      // at the very bottom, the last rows (footer copyright) can never reach the 90% line
      const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
      pending = pending.filter(b => {
        if (!b.el.isConnected) return false;
        const r = b.el.getBoundingClientRect();
        if ((r.top < vh * 0.95 || (atEnd && r.top < vh)) && r.bottom > 0) {
          b.el.style.opacity = '1';
          b.el.style.transform = 'none';
          // hand the element back to its own styles once the reveal has finished
          timers.push(setTimeout(() => {
            const s = b.el.style;
            s.opacity = ''; s.transform = ''; s.transition = b.saved;
          }, (b.delay + 1) * 1000));
          return false;
        }
        return true;
      });
    };

    // pages set up their own reveals on mount (Apply mounts late, client-only), so scan a few times
    [120, 700, 1600].forEach(t => timers.push(setTimeout(scan, t)));
    window.addEventListener('scroll', check, { passive: true });
    const iv = setInterval(check, 400);
    return () => {
      window.removeEventListener('scroll', check);
      clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, []);
  return null;
}
