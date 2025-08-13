#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Build function inline to avoid module issues
function buildSlides() {
  const fs = require('fs');
  const path = require('path');

  // Read the base index.html template
  const indexTemplate = fs.readFileSync('index-dev.html', 'utf8');

  // Slide configuration
  const SLIDES = [
    '01-intro.html', '02-mindset.html', '03-frontend-backend.html',
    '04-ai-prompts.html', '05-secrets.html', '06-rls.html',
    '07-xss-demo.html', '08-api-limits.html', '09-cors-headers.html',
    '10-storage.html', '11-server-calls.html', '12-vuln-classes.html',
    '13-keep-current.html', '14-rls-testing.html', '15-checklist.html',
    '16-resources.html'
  ];

  // Read all slide content
  let allSlidesContent = '';
  for (const slideFile of SLIDES) {
    const slidePath = path.join('slides', slideFile);
    if (fs.existsSync(slidePath)) {
      const slideContent = fs.readFileSync(slidePath, 'utf8');
      allSlidesContent += slideContent + '\n';
    }
  }

  // Replace the content placeholder with actual slides
  const finalHTML = indexTemplate.replace(
    '<!-- Slides will be dynamically loaded here -->',
    allSlidesContent
  );

  // Write the combined file
  fs.writeFileSync('index.html', finalHTML);
}

console.log('🔍 Watching slides/ folder for changes...');
console.log('📁 Will auto-rebuild index.html when any slide is modified');
console.log('🛑 Press Ctrl+C to stop watching');

// Initial build
console.log('\n🏗️  Initial build...');
buildSlides();

// Watch the slides directory
const slidesDir = path.join(__dirname, 'slides');

if (!fs.existsSync(slidesDir)) {
  console.error('❌ slides/ directory not found');
  process.exit(1);
}

let building = false;

fs.watch(slidesDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('.html') && !building) {
    building = true;
    console.log(`\n📝 ${filename} changed, rebuilding...`);
    
    // Small delay to avoid multiple rapid rebuilds
    setTimeout(() => {
      try {
        buildSlides();
        console.log('✅ index.html updated');
      } catch (error) {
        console.error('❌ Build failed:', error.message);
      }
      building = false;
    }, 100);
  }
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Stopping file watcher...');
  process.exit(0);
});