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
  const slideIndicator = $('#slideIndicator');
  const currentSlideSpan = $('#currentSlide');
  const totalSlidesSpan = $('#totalSlides');
  
  // Update total slides count
  if (totalSlidesSpan) totalSlidesSpan.textContent = sections.length;
  
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
    
    // Determine current section index for active dot and slide indicator
    let idx = 0;
    for (let i = 0; i < sections.length; i++) {
      const top = sections[i].offsetTop;
      if (scrolled >= top - 1) idx = i; else break;
    }
    
    // Update slide indicator
    if (currentSlideSpan) currentSlideSpan.textContent = idx + 1;
    
    // Update active dot
    const dots = $$('.dot', dotsWrap || document);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    
    // Update table of contents active item
    updateTOCActive(idx);
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

function initTOC() {
  const tocItems = $$('.toc-item');
  const scroller = getScroller();
  const toc = $('#tableOfContents');
  const slides = $$('.slide');
  
  // Handle TOC item clicks
  tocItems.forEach(item => {
    item.addEventListener('click', () => {
      const slideId = item.dataset.slide;
      const targetSlide = $(`#${slideId}`);
      if (targetSlide && scroller) {
        scroller.scrollTo({ top: targetSlide.offsetTop, behavior: 'smooth' });
      }
    });
  });
  
  // Handle left border hover to show TOC
  let tocTimeout;
  
  slides.forEach(slide => {
    const leftBorder = slide;
    
    leftBorder.addEventListener('mouseenter', (e) => {
      // Only trigger if hovering near the left edge
      if (e.clientX <= 30) {
        clearTimeout(tocTimeout);
        if (toc) {
          toc.style.opacity = '1';
          toc.style.pointerEvents = 'auto';
          toc.style.transform = 'translateX(0)';
        }
      }
    });
  });
  
  // Handle TOC hover to keep it open
  if (toc) {
    toc.addEventListener('mouseenter', () => {
      clearTimeout(tocTimeout);
    });
    
    toc.addEventListener('mouseleave', () => {
      tocTimeout = setTimeout(() => {
        toc.style.opacity = '0';
        toc.style.pointerEvents = 'none';
        toc.style.transform = 'translateX(-100%)';
      }, 500);
    });
  }
  
  // Hide TOC when mouse leaves left area
  document.addEventListener('mousemove', (e) => {
    if (e.clientX > 350 && toc) {
      tocTimeout = setTimeout(() => {
        toc.style.opacity = '0';
        toc.style.pointerEvents = 'none';
        toc.style.transform = 'translateX(-100%)';
      }, 1000);
    }
  });
}

function updateTOCActive(currentIndex) {
  const tocItems = $$('.toc-item');
  tocItems.forEach((item, i) => {
    item.classList.toggle('active', i === currentIndex);
  });
}

function main() {
  initProgress();
  initKeyboardNav();
  initSnapWheel();
  initNavActive();
  initTOC();
  
  // Initialize all interactive demos
  initAllDemos();
  
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
}

document.addEventListener('DOMContentLoaded', main);
