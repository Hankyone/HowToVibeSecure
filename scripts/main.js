// Minimal client script: progress and navigation (light mode only)

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const getScroller = () => document.getElementById('content');

function getSections() {
  return $$('.slide');
}

function nextSection(dir = 1) {
  const scroller = getScroller();
  const sections = getSections();
  const pos = (scroller?.scrollTop || 0) + 1; // nudge to avoid edge rounding
  let currentIndex = sections.findIndex(s => {
    const top = s.offsetTop;
    const bottom = top + s.offsetHeight;
    return pos >= top && pos < bottom;
  });
  if (currentIndex === -1) currentIndex = 0;
  const target = sections[Math.min(Math.max(currentIndex + dir, 0), sections.length - 1)];
  if (scroller && target) {
    scroller.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    target.focus({ preventScroll: true });
  }
}

function initProgress() {
  const scroller = getScroller();
  const fill = $('#timelineFill');
  const dotsWrap = $('#timelineDots');
  const sections = getSections();
  // Build dots
  if (dotsWrap && sections.length) {
    dotsWrap.innerHTML = '';
    const max = () => (scroller?.scrollHeight || 0) - (scroller?.clientHeight || 0);
    sections.forEach((s, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.title = `${i + 1}. ${s.querySelector('h1, h2')?.textContent || s.id}`;
      const setPos = () => {
        const pct = max() ? (s.offsetTop / max()) * 100 : 0;
        dot.style.left = `${Math.max(0, Math.min(100, pct))}%`;
      };
      setPos();
      dot.addEventListener('click', () => scroller?.scrollTo({ top: s.offsetTop, behavior: 'smooth' }));
      dotsWrap.appendChild(dot);
      window.addEventListener('resize', setPos);
    });
  }
  const onScroll = () => {
    const scrolled = scroller?.scrollTop || 0;
    const max = (scroller?.scrollHeight || 0) - (scroller?.clientHeight || 0);
    const pct = Math.max(0, Math.min(1, max ? scrolled / max : 0));
    if (fill) fill.style.width = `${pct * 100}%`;
    // Determine current section index for active dot
    let idx = 0;
    for (let i = 0; i < sections.length; i++) {
      const top = sections[i].offsetTop;
      if (scrolled >= top - 1) idx = i; else break;
    }
    const dots = $$('.dot', dotsWrap || document);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  };
  scroller?.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Brand pin is now always visible via CSS

function initKeyboardNav() {
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes((e.target && e.target.tagName) || '')) return;
    if (e.key === 'j' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      nextSection(1);
    }
    if (e.key === 'k' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      nextSection(-1);
    }
    if (e.key === 'Home') {
      e.preventDefault();
      getSections()[0]?.scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'End') {
      e.preventDefault();
      const s = getSections();
      s[s.length - 1]?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

function initSnapWheel() {
  const scroller = getScroller();
  if (!scroller) return;
  let animating = false;
  let accum = 0;
  let targetTop = null;
  const reset = () => { animating = false; targetTop = null; accum = 0; };
  const onWheel = (e) => {
    // Ignore if user is using horizontal scroll or holding modifiers
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    accum += e.deltaY;
    if (animating) { e.preventDefault(); return; }
    const threshold = 40; // minimal intent to move a slide
    if (Math.abs(accum) > threshold) {
      e.preventDefault();
      const dir = accum > 0 ? 1 : -1;
      accum = 0;
      const sections = getSections();
      // Find current index by nearest offsetTop <= scrollTop
      let idx = 0;
      for (let i = 0; i < sections.length; i++) {
        if ((scroller.scrollTop + 1) >= sections[i].offsetTop) idx = i; else break;
      }
      const nextIdx = Math.min(Math.max(idx + dir, 0), sections.length - 1);
      const target = sections[nextIdx];
      if (!target) return;
      animating = true;
      targetTop = target.offsetTop;
      scroller.scrollTo({ top: targetTop, behavior: 'smooth' });
      // Fallback timer in case 'scroll' doesn't settle
      setTimeout(reset, 600);
    }
  };
  const onScroll = () => {
    if (targetTop == null) return;
    const diff = Math.abs(scroller.scrollTop - targetTop);
    if (diff < 2) reset();
  };
  scroller.addEventListener('wheel', onWheel, { passive: false });
  scroller.addEventListener('scroll', onScroll, { passive: true });
}

function initNavActive() { /* replaced by timeline */ }

function mountXSSPlaceholder() {
  const mount = $('#xssMount');
  if (!mount) return;
  mount.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap">
      <div style="flex:1;min-width:260px">
        <label for="xssInput"><strong>Try some HTML/JS</strong></label>
        <textarea id="xssInput" rows="5" style="width:100%" placeholder="e.g. &lt;img src=x onerror=alert(1)&gt;"></textarea>
        <div style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap">
          <button id="btnInsecure">Render (insecure)</button>
          <button id="btnSecure">Render (escaped)</button>
          <button id="btnClear">Clear</button>
        </div>
      </div>
      <div style="flex:1;min-width:260px">
        <div><strong>Output</strong></div>
        <div id="xssOut" style="min-height:4rem;border:1px solid var(--border);border-radius:0.5rem;padding:0.5rem;background:color-mix(in oklab, var(--bg-elev), white 2%)"></div>
      </div>
    </div>
    <p style="margin-top:0.75rem;color:var(--muted)">This is a placeholder. Next step adds the real insecure vs secure paths.</p>
  `;
  const input = $('#xssInput');
  const out = $('#xssOut');
  $('#btnInsecure')?.addEventListener('click', () => { out.innerHTML = input.value; });
  $('#btnSecure')?.addEventListener('click', () => { out.textContent = input.value; });
  $('#btnClear')?.addEventListener('click', () => { input.value = ''; out.textContent = ''; });
}

function main() {
  initProgress();
  initKeyboardNav();
  initSnapWheel();
  initNavActive();
  // Auto-show timeline on interaction
  let uiTimer = null;
  const wakeUI = () => {
    document.body.setAttribute('data-ui-awake', 'true');
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => document.body.setAttribute('data-ui-awake', 'false'), 1500);
  };
  ['mousemove','keydown','touchstart','wheel'].forEach(ev => window.addEventListener(ev, wakeUI, { passive: true }));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      /* nothing to close now */
    }
  });
  mountXSSPlaceholder();
}

document.addEventListener('DOMContentLoaded', main);
