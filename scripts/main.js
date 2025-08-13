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
  const sections = getSections();
  const currentSlideSpan = $('#currentSlide');
  const totalSlidesSpan = $('#totalSlides');
  
  // Update total slides count
  if (totalSlidesSpan) totalSlidesSpan.textContent = sections.length;
  
  const onScroll = () => {
    const scrolled = scroller?.scrollTop || 0;
    
    // Determine current section index for slide indicator
    let idx = 0;
    for (let i = 0; i < sections.length; i++) {
      const top = sections[i].offsetTop;
      if (scrolled >= top - 1) idx = i; else break;
    }
    
    // Update slide indicator
    if (currentSlideSpan) currentSlideSpan.textContent = idx + 1;
    
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
  
  // Simple left edge hover detection
  let tocVisible = false;
  let hideTimeout;
  
  function showTOC() {
    if (toc) {
      clearTimeout(hideTimeout);
      tocVisible = true;
      toc.style.opacity = '1';
      toc.style.pointerEvents = 'auto';
      toc.style.transform = 'translateX(0)';
    }
  }
  
  function hideTOC() {
    if (toc) {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        tocVisible = false;
        toc.style.opacity = '0';
        toc.style.pointerEvents = 'none';
        toc.style.transform = 'translateX(-100%)';
      }, 300);
    }
  }
  
  // Show TOC when hovering near left edge of any slide
  document.addEventListener('mousemove', (e) => {
    if (e.clientX <= 25 && !tocVisible) {
      showTOC();
    } else if (e.clientX > 340 && tocVisible) {
      hideTOC();
    }
  });
  
  // Keep TOC open when hovering over it
  if (toc) {
    toc.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
    });
    
    toc.addEventListener('mouseleave', () => {
      hideTOC();
    });
  }
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

// Slide demo functions (merged from slide-modules.js)

// Frontend vs Backend Demo
function initFrontendBackendDemo() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (!checkoutBtn) return;

  let attempts = 0;
  
  checkoutBtn.addEventListener('click', () => {
    attempts++;
    const status = document.querySelector('#frontendBackendDemo .demo-status');
    
    if (checkoutBtn.disabled) {
      // This shouldn't happen normally, but DevTools can bypass
      status.innerHTML = `<span class="warning">⚠️ Button was disabled, but click went through! (Attempt ${attempts})</span>`;
    } else {
      status.innerHTML = `<span class="success">✅ Server validated: Payment processed! But in real life, server should check permissions regardless of UI state. (Attempt ${attempts})</span>`;
    }
    
    // Show the security lesson
    setTimeout(() => {
      status.innerHTML += `<br><strong>Security lesson:</strong> Always validate on the server, never trust the client!`;
    }, 1000);
  });

  // Show instructions
  const instructions = document.createElement('div');
  instructions.className = 'demo-instructions';
  instructions.innerHTML = `
    <p><strong>Try this:</strong></p>
    <ol>
      <li>Right-click the button → Inspect Element</li>
      <li>Remove the <code>disabled</code> attribute</li>
      <li>Click the button</li>
    </ol>
  `;
  checkoutBtn.parentNode.appendChild(instructions);
}

// Secrets Scanner Demo
function initSecretsDemo() {
  const textarea = document.querySelector('#secretsDemo textarea');
  const results = document.querySelector('#secretsDemo .scan-results');
  if (!textarea || !results) return;

  window.scanForSecrets = function(button) {
    const code = textarea.value;
    if (!code.trim()) {
      results.innerHTML = '<p class="warning">Please paste some code to scan!</p>';
      return;
    }

    const patterns = [
      { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g, risk: 'HIGH' },
      { name: 'API Key Pattern', regex: /api[_-]?key['"]\s*[:=]\s*['"]\w+/gi, risk: 'HIGH' },
      { name: 'Secret Key', regex: /secret[_-]?key['"]\s*[:=]\s*['"]\w+/gi, risk: 'HIGH' },
      { name: 'Password in Code', regex: /password['"]\s*[:=]\s*['"]\w+/gi, risk: 'MEDIUM' },
      { name: 'Token Pattern', regex: /token['"]\s*[:=]\s*['"]\w+/gi, risk: 'MEDIUM' },
      { name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9_]{36}/g, risk: 'HIGH' },
      { name: 'JWT Token', regex: /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, risk: 'MEDIUM' },
    ];

    let findings = [];
    patterns.forEach(pattern => {
      const matches = code.match(pattern.regex);
      if (matches) {
        findings.push({
          ...pattern,
          matches: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    });

    if (findings.length === 0) {
      results.innerHTML = '<p class="success">✅ No obvious secrets detected!</p>';
    } else {
      results.innerHTML = `
        <div class="findings">
          <h4>🚨 Potential Secrets Found:</h4>
          ${findings.map(finding => `
            <div class="finding ${finding.risk.toLowerCase()}">
              <strong>${finding.name}</strong> (${finding.risk} risk)
              <br>Found ${finding.matches} occurrence(s)
              <br><code>${finding.examples[0]}...</code>
            </div>
          `).join('')}
        </div>
      `;
    }
  };

  // Add sample dangerous code
  const sampleBtn = document.createElement('button');
  sampleBtn.textContent = 'Load Sample Vulnerable Code';
  sampleBtn.style.marginTop = '0.5rem';
  sampleBtn.onclick = () => {
    textarea.value = `
const config = {
  apiKey: "AKIAIOSFODNN7EXAMPLE",
  secret_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  database_password: "super_secret_123",
  jwt_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
};
    `.trim();
  };
  textarea.parentNode.appendChild(sampleBtn);
}

// RLS Demo
function initRLSDemo() {
  let currentUser = 'A';
  
  const tabs = document.querySelectorAll('#rlsDemo .user-tab');
  const results = document.querySelector('#rlsDemo .rls-results');
  
  if (!tabs.length || !results) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentUser = tab.dataset.user;
      results.innerHTML = `<p>Switched to User ${currentUser}</p>`;
    });
  });

  window.testRLS = function(action, target) {
    const isOwn = target === 'own';
    const targetUser = isOwn ? currentUser : (currentUser === 'A' ? 'B' : 'A');
    
    // Simulate RLS behavior
    const shouldSucceed = isOwn || (action === 'read' && Math.random() > 0.8); // Some read cross-contamination
    
    const resultClass = shouldSucceed ? 'success' : 'error';
    const resultIcon = shouldSucceed ? '✅' : '❌';
    const resultText = shouldSucceed ? 'ALLOWED' : 'DENIED';
    
    const resultMsg = `
      <div class="rls-result ${resultClass}">
        ${resultIcon} User ${currentUser} → ${action.toUpperCase()} User ${targetUser}'s data: ${resultText}
      </div>
    `;
    
    results.innerHTML = resultMsg;
    
    if (!shouldSucceed && !isOwn) {
      results.innerHTML += '<p class="security-note">✅ Good! RLS is working - users cannot access other users\' data.</p>';
    } else if (shouldSucceed && !isOwn) {
      results.innerHTML += '<p class="security-warning">⚠️ Security Issue! User can access other users\' data. Check your RLS policies!</p>';
    }
  };
}

// XSS Demo (Enhanced from existing)
function initXSSDemo() {
  const input = document.getElementById('xssInput');
  const output = document.getElementById('xssOut');
  const btnInsecure = document.getElementById('btnInsecure');
  const btnSecure = document.getElementById('btnSecure');
  const btnClear = document.getElementById('btnClear');
  
  if (!input || !output) return;

  btnInsecure?.addEventListener('click', () => {
    // Intentionally unsafe for demo
    output.innerHTML = input.value;
    output.className = 'xss-output insecure';
  });

  btnSecure?.addEventListener('click', () => {
    // Safe text content
    output.textContent = input.value;
    output.className = 'xss-output secure';
  });

  btnClear?.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    output.className = '';
  });

  // Add sample XSS payloads
  const samplesDiv = document.createElement('div');
  samplesDiv.className = 'xss-samples';
  samplesDiv.innerHTML = `
    <details>
      <summary>Sample XSS Payloads (for testing)</summary>
      <div class="sample-buttons">
        <button onclick="document.getElementById('xssInput').value = '&lt;img src=x onerror=alert(\\'XSS!\\')&gt;'">Image XSS</button>
        <button onclick="document.getElementById('xssInput').value = '&lt;script&gt;alert(\\'XSS!\\')&lt;/script&gt;'">Script Tag</button>
        <button onclick="document.getElementById('xssInput').value = '&lt;svg onload=alert(\\'XSS!\\')&gt;'">SVG XSS</button>
      </div>
    </details>
  `;
  input.parentNode.appendChild(samplesDiv);
}

// Rate Limiting Demo
function initRateLimitDemo() {
  const log = document.querySelector('#rateLimitDemo .request-log');
  if (!log) return;

  let requestCount = 0;
  let isLimited = false;
  const RATE_LIMIT = 5;
  const WINDOW_MS = 10000; // 10 seconds

  window.makeRequest = function() {
    requestCount++;
    
    if (requestCount > RATE_LIMIT && !isLimited) {
      isLimited = true;
      setTimeout(() => {
        isLimited = false;
        requestCount = 0;
      }, WINDOW_MS);
    }

    const timestamp = new Date().toLocaleTimeString();
    const status = isLimited ? '429 Too Many Requests' : '200 OK';
    const statusClass = isLimited ? 'error' : 'success';
    
    const logEntry = `
      <div class="log-entry ${statusClass}">
        [${timestamp}] Request ${requestCount}: ${status}
      </div>
    `;
    
    log.innerHTML = logEntry + log.innerHTML;
    
    // Limit log entries
    const entries = log.children;
    if (entries.length > 10) {
      entries[entries.length - 1].remove();
    }
  };

  window.floodRequests = function() {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => makeRequest(), i * 100);
    }
  };

  window.resetLimits = function() {
    requestCount = 0;
    isLimited = false;
    log.innerHTML = '<p class="info">Rate limits reset!</p>';
  };
}

// Headers Demo
function initHeadersDemo() {
  window.checkHeaders = function() {
    const output = document.querySelector('#headersDemo .headers-output');
    if (!output) return;

    // Simulate checking headers (in real app, this would be a fetch)
    const mockHeaders = {
      'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Access-Control-Allow-Origin': window.location.origin
    };

    const headersHtml = Object.entries(mockHeaders).map(([key, value]) => `
      <div class="header-item">
        <strong>${key}:</strong><br>
        <code>${value}</code>
      </div>
    `).join('');

    output.innerHTML = `
      <div class="headers-list">
        <h4>Current Security Headers:</h4>
        ${headersHtml}
      </div>
    `;
  };
}

// File Upload Demo
function initUploadDemo() {
  const fileInput = document.getElementById('fileInput');
  const uploadStatus = document.querySelector('#uploadDemo .upload-status');
  const validationResults = document.querySelector('#uploadDemo .validation-results');
  
  if (!fileInput || !uploadStatus || !validationResults) return;

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.innerHTML = `<p>Validating file: <strong>${file.name}</strong></p>`;
    
    const validations = [];
    
    // Type validation
    if (ALLOWED_TYPES.includes(file.type)) {
      validations.push({ check: 'File type', status: 'pass', message: `${file.type} is allowed` });
    } else {
      validations.push({ check: 'File type', status: 'fail', message: `${file.type} is not allowed` });
    }
    
    // Size validation
    if (file.size <= MAX_SIZE) {
      validations.push({ check: 'File size', status: 'pass', message: `${(file.size / 1024 / 1024).toFixed(2)} MB is within limit` });
    } else {
      validations.push({ check: 'File size', status: 'fail', message: `${(file.size / 1024 / 1024).toFixed(2)} MB exceeds 5MB limit` });
    }
    
    // Extension check
    const ext = file.name.split('.').pop().toLowerCase();
    const suspiciousExts = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar'];
    if (suspiciousExts.includes(ext)) {
      validations.push({ check: 'File extension', status: 'fail', message: `${ext} files are blocked for security` });
    } else {
      validations.push({ check: 'File extension', status: 'pass', message: `${ext} extension is safe` });
    }

    const allPassed = validations.every(v => v.status === 'pass');
    
    validationResults.innerHTML = `
      <div class="validation-summary ${allPassed ? 'success' : 'error'}">
        ${allPassed ? '✅ File would be accepted' : '❌ File would be rejected'}
      </div>
      <div class="validation-details">
        ${validations.map(v => `
          <div class="validation-item ${v.status}">
            <strong>${v.check}:</strong> ${v.message}
          </div>
        `).join('')}
      </div>
    `;
  });
}

// SSRF Protection Demo
function initSSRFDemo() {
  window.testSSRF = function(button) {
    const input = button.previousElementSibling;
    const results = document.querySelector('#ssrfDemo .ssrf-results');
    const url = input.value;
    
    if (!url) {
      results.innerHTML = '<p class="warning">Please enter a URL to test!</p>';
      return;
    }

    // Simulate SSRF protection
    const blocked = [
      'localhost',
      '127.0.0.1',
      '169.254.169.254', // AWS metadata
      '0.0.0.0',
      '10.',
      '192.168.',
      '172.16.',
      '172.17.',
      '172.18.',
      '172.19.',
      '172.20.',
      '172.21.',
      '172.22.',
      '172.23.',
      '172.24.',
      '172.25.',
      '172.26.',
      '172.27.',
      '172.28.',
      '172.29.',
      '172.30.',
      '172.31.'
    ];

    const isBlocked = blocked.some(pattern => url.includes(pattern));
    
    if (isBlocked) {
      results.innerHTML = `
        <div class="ssrf-result error">
          ❌ Request blocked: URL targets private/internal network
          <br><strong>Blocked URL:</strong> <code>${url}</code>
          <br><em>This protects against SSRF attacks</em>
        </div>
      `;
    } else {
      results.innerHTML = `
        <div class="ssrf-result success">
          ✅ Request would be allowed: URL targets public internet
          <br><strong>URL:</strong> <code>${url}</code>
          <br><em>Remember to also validate response content and implement timeouts</em>
        </div>
      `;
    }
  };

  // Add sample dangerous URLs
  const container = document.querySelector('#ssrfDemo');
  const samples = document.createElement('div');
  samples.className = 'ssrf-samples';
  samples.innerHTML = `
    <p><strong>Try these:</strong></p>
    <div class="sample-buttons">
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://169.254.169.254/latest/meta-data/'">AWS Metadata</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://localhost:3000/admin'">Localhost</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'https://example.com/api'">Safe External</button>
    </div>
  `;
  container.appendChild(samples);
}

// RLS Testing Demo
function initRLSTestingDemo() {
  window.runRLSTest = function() {
    const output = document.querySelector('#rlsTestDemo .test-output');
    if (!output) return;

    output.innerHTML = '<div class="loading">Running RLS tests...</div>';
    
    // Simulate the 3-step test
    const steps = [
      { step: 1, description: 'Creating test users A and B...', delay: 1000 },
      { step: 2, description: 'Testing User A permissions...', delay: 2000 },
      { step: 3, description: 'Testing User B permissions...', delay: 3000 },
      { step: 4, description: 'Analyzing results...', delay: 4000 }
    ];

    steps.forEach(({ step, description, delay }) => {
      setTimeout(() => {
        if (step < 4) {
          output.innerHTML += `<div class="test-step">Step ${step}: ${description}</div>`;
        } else {
          // Final results
          const results = Math.random() > 0.5 ? 'pass' : 'fail';
          output.innerHTML += `
            <div class="test-results ${results}">
              <h4>Test Results:</h4>
              ${results === 'pass' ? `
                <div class="result-item success">✅ User A can read/write own data</div>
                <div class="result-item success">✅ User A cannot read User B's data</div>
                <div class="result-item success">✅ User B can read/write own data</div>
                <div class="result-item success">✅ User B cannot read User A's data</div>
                <p class="conclusion success">🎉 RLS is working correctly!</p>
              ` : `
                <div class="result-item success">✅ User A can read/write own data</div>
                <div class="result-item error">❌ User A can read User B's data</div>
                <div class="result-item success">✅ User B can read/write own data</div>
                <div class="result-item error">❌ User B can read User A's data</div>
                <p class="conclusion error">⚠️ RLS policies need fixing!</p>
              `}
            </div>
          `;
        }
      }, delay);
    });
  };
}

// Initialize all demos
function initAllDemos() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initAllDemos, 100);
    });
    return;
  }

  initFrontendBackendDemo();
  initSecretsDemo();
  initRLSDemo();
  initXSSDemo();
  initRateLimitDemo();
  initHeadersDemo();
  initUploadDemo();
  initSSRFDemo();
  initRLSTestingDemo();
}

document.addEventListener('DOMContentLoaded', main);
