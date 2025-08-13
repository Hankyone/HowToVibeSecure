// Minimal client script: progress and navigation (light mode only)

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const getScroller = () => document.getElementById('content');

// Slide configuration
const SLIDES = [
  { id: 'intro', file: '01-intro.html', title: 'How To Vibe Secure' },
  { id: 'mindset', file: '02-mindset.html', title: 'Mindset: Default‑Deny' },
  { id: 'frontend-backend', file: '03-frontend-backend.html', title: 'Frontend vs Backend' },
  { id: 'ai-prompts', file: '04-ai-prompts.html', title: 'How to Talk to Your AI' },
  { id: 'secrets', file: '05-secrets.html', title: 'Secrets Management' },
  { id: 'rls', file: '06-rls.html', title: 'Data Access (RLS)' },
  { id: 'xss-demo', file: '07-xss-demo.html', title: 'Input Validation & XSS' },
  { id: 'api-limits', file: '08-api-limits.html', title: 'API Surface & Rate Limiting' },
  { id: 'cors-headers', file: '09-cors-headers.html', title: 'CORS & Headers' },
  { id: 'storage', file: '10-storage.html', title: 'Storage & File Uploads' },
  { id: 'server-calls', file: '11-server-calls.html', title: 'Server‑Side API Calls' },
  { id: 'vuln-classes', file: '12-vuln-classes.html', title: 'Vulnerability Classes' },
  { id: 'keep-current', file: '13-keep-current.html', title: 'Keep It Current' },
  { id: 'rls-testing', file: '14-rls-testing.html', title: 'RLS Testing in 3 Steps' },
  { id: 'checklist', file: '15-checklist.html', title: '10‑Minute Hardening Checklist' },
  { id: 'resources', file: '16-resources.html', title: 'Resources & Next Steps' }
];

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
  const sections = getSections();
  const currentSlideSpan = $('#currentSlide');
  const totalSlidesSpan = $('#totalSlides');
  
  // Update total slides count
  if (totalSlidesSpan) totalSlidesSpan.textContent = SLIDES.length;
  
  const onScroll = () => {
    const scrolled = scroller?.scrollTop || 0;
    const allSections = getSections();
    
    // Determine current section index for slide indicator
    let idx = 0;
    for (let i = 0; i < allSections.length; i++) {
      const section = allSections[i];
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + (section.offsetHeight * 0.5); // Use midpoint
      
      if (scrolled >= sectionTop && scrolled < sectionBottom) {
        idx = i;
        break;
      } else if (scrolled >= sectionTop) {
        idx = i; // Fallback for last section
      }
    }
    
    // Update slide indicator
    if (currentSlideSpan) currentSlideSpan.textContent = idx + 1;
    
    // Update table of contents active item
    updateTOCActive(idx);
  };
  
  scroller?.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  
  // Check content overflow on load and resize
  checkContentOverflow();
  window.addEventListener('resize', checkContentOverflow, { passive: true });

  // Robust slide detection: also use IntersectionObserver when available
  if (typeof IntersectionObserver !== 'undefined' && scroller) {
    const observedSections = getSections();
    let lastIdx = -1;
    const io = new IntersectionObserver((entries) => {
      // Pick the most visible slide
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const idx = observedSections.indexOf(visible.target);
      if (idx !== -1 && idx !== lastIdx) {
        lastIdx = idx;
        if (currentSlideSpan) currentSlideSpan.textContent = idx + 1;
        updateTOCActive(idx);
      }
    }, { root: scroller, threshold: [0.51] });
    observedSections.forEach(s => io.observe(s));
  }

  // Fallback: RAF watcher in case scroll events are missed by the scroller
  if (scroller && typeof requestAnimationFrame !== 'undefined') {
    let lastTop = -1;
    const tick = () => {
      const top = scroller.scrollTop || 0;
      if (top !== lastTop) {
        onScroll();
        lastTop = top;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

function checkContentOverflow() {
  const slides = getSections();
  slides.forEach(slide => {
    // Reset classes
    slide.classList.remove('overflow-content', 'scale-content');
    
    // Check if content is taller than viewport
    const slideHeight = slide.offsetHeight;
    const viewportHeight = window.innerHeight;
    const contentHeight = slide.scrollHeight;
    
    if (contentHeight > viewportHeight * 0.95) {
      // If content is very tall, try scaling first
      if (contentHeight > viewportHeight * 1.2) {
        slide.classList.add('scale-content');
        // Re-check after scaling
        setTimeout(() => {
          if (slide.scrollHeight > viewportHeight * 0.98) {
            slide.classList.add('overflow-content');
          }
        }, 100);
      } else {
        slide.classList.add('overflow-content');
      }
    }
  });
}

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

function initTOC() {
  const tocItems = $$('.toc-item');
  const scroller = getScroller();
  const toc = $('#tableOfContents');
  const slideIndicator = $('#slideIndicator');
  
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
  
  if (toc && slideIndicator) {
    let hideTimeout;
    
    function showTOC() {
      clearTimeout(hideTimeout);
      toc.classList.add('show');
    }
    
    function hideTOC() {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        toc.classList.remove('show');
      }, 200);
    }
    
    // Show TOC when hovering slide indicator
    slideIndicator.addEventListener('mouseenter', showTOC);
    slideIndicator.addEventListener('mouseleave', hideTOC);
    // Also show TOC on click/tap for touch devices
    slideIndicator.addEventListener('click', () => {
      if (!toc.classList.contains('show')) {
        showTOC();
      } else {
        toc.classList.remove('show');
      }
    });
    
    // Keep TOC open when hovering over it
    toc.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
    });
    
    toc.addEventListener('mouseleave', hideTOC);
  }
}

function updateTOCActive(currentIndex) {
  const tocItems = $$('.toc-item');
  tocItems.forEach((item, i) => {
    item.classList.toggle('active', i === currentIndex);
  });
}

// Slide content embedded to avoid CORS issues with file://
const SLIDE_CONTENT = {};

async function loadSlides() {
  const content = $('#content');
  if (!content) return;

  // Check if slides are already embedded in DOM or if we need to load them
  const existingSlides = $$('.slide');
  if (existingSlides.length > 0) {
    // Slides already loaded, just init demos
    if (typeof initAllDemos === 'function') {
      initAllDemos();
    }
    initProgress();
    return;
  }

  // If running from file://, try to load via script tags or fallback
  // For now, show error message with instructions
  content.innerHTML = `
    <section class="slide" id="error" data-color="red" tabindex="-1">
      <h2>⚠️ Loading Issue</h2>
      <p>The multi-file structure requires a web server to work properly.</p>
      <h3>Solutions:</h3>
      <ul>
        <li><strong>Option 1:</strong> Run <code>python3 -m http.server 8001</code> and visit <code>http://localhost:8001</code></li>
        <li><strong>Option 2:</strong> Use the original single-file version for direct file:// access</li>
        <li><strong>Option 3:</strong> Use VS Code Live Server extension</li>
      </ul>
      <p><em>The slides are in individual files for parallel development, but need a server to load.</em></p>
    </section>
  `;
  
  // Initialize progress with error slide
  initProgress();
}

function main() {
  // Load slides first, then initialize everything else
  loadSlides().then(() => {
    initKeyboardNav();
    initSnapWheel();
    initTOC();
    initViewportStabilization();
    
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
  });
}

function initViewportStabilization() {
  const scroller = getScroller();
  if (!scroller) return;
  
  // Disable browser scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  
  let currentSlideIndex = 0;
  let isResizing = false;
  let resizeTimeout = null;
  
  // Track current slide index based on scroll position
  const updateCurrentSlide = () => {
    if (isResizing) return; // Don't update during resize
    
    const sections = getSections();
    const scrolled = scroller.scrollTop + 1; // Small offset for edge cases
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      
      if (scrolled >= sectionTop && scrolled < sectionBottom) {
        currentSlideIndex = i;
        break;
      }
    }
  };
  
  // Handle resize start - disable snap immediately
  const handleResizeStart = () => {
    if (isResizing) return;
    
    isResizing = true;
    scroller.classList.add('no-snap');
    
    // Clear any existing timeout
    clearTimeout(resizeTimeout);
  };
  
  // Handle resize end - restore position and re-enable snap
  const handleResizeEnd = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const sections = getSections();
      const targetSection = sections[currentSlideIndex];
      
      if (targetSection) {
        // Scroll to the correct slide without animation
        scroller.scrollTo({
          top: targetSection.offsetTop,
          behavior: 'auto'
        });
        
        // Re-enable snap after a brief delay
        setTimeout(() => {
          scroller.classList.remove('no-snap');
          isResizing = false;
        }, 50);
      } else {
        scroller.classList.remove('no-snap');
        isResizing = false;
      }
      
      // Update content overflow after stabilization
      setTimeout(() => {
        checkContentOverflow();
      }, 100);
    }, 150); // Debounce resize events
  };
  
  // Listen for scroll to track current slide
  scroller.addEventListener('scroll', updateCurrentSlide, { passive: true });
  
  // Listen for resize events
  window.addEventListener('resize', () => {
    handleResizeStart();
    handleResizeEnd();
  }, { passive: true });
  
  // Initialize current slide
  updateCurrentSlide();
}

// Ensure initialization even if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}