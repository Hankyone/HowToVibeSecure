#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the base index-dev.html template (clean template without embedded content)
const indexTemplate = fs.readFileSync('index-dev.html', 'utf8');

// Slide configuration
const SLIDES = [
  '01-intro.html',
  '02-mindset.html', 
  '03-frontend-backend.html',
  '04-ai-prompts.html',
  '05-secrets.html',
  '06-rls.html',
  '07-xss-demo.html',
  '08-api-limits.html',
  '09-cors-headers.html',
  '10-storage.html',
  '11-server-calls.html',
  '12-vuln-classes.html',
  '13-keep-current.html',
  '14-rls-testing.html',
  '15-checklist.html',
  '16-resources.html'
];

// Read all slide content
let allSlidesContent = '';
for (const slideFile of SLIDES) {
  const slidePath = path.join('slides', slideFile);
  if (fs.existsSync(slidePath)) {
    const slideContent = fs.readFileSync(slidePath, 'utf8');
    allSlidesContent += slideContent + '\n';
  } else {
    console.warn(`Warning: ${slideFile} not found`);
  }
}

// Read and inline all CSS files
const cssFiles = ['styles/main.css', 'styles/slides.css', 'styles/demos.css'];
let inlinedCSS = '';

for (const cssFile of cssFiles) {
  if (fs.existsSync(cssFile)) {
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    inlinedCSS += cssContent + '\n';
  }
}

// Read and inline all JavaScript files
const jsFiles = ['scripts/main.js', 'scripts/demos.js'];
let inlinedJS = '';

for (const jsFile of jsFiles) {
  if (fs.existsSync(jsFile)) {
    const jsContent = fs.readFileSync(jsFile, 'utf8');
    inlinedJS += jsContent + '\n';
  }
}

// Replace CSS links with inlined styles and JS scripts with inlined code
let finalHTML = indexTemplate
  .replace('<!-- Slides will be dynamically loaded here -->', allSlidesContent)
  .replace(
    '<link rel="stylesheet" href="styles/main.css" />\n    <link rel="stylesheet" href="styles/slides.css" />\n    <link rel="stylesheet" href="styles/demos.css" />',
    `<style>\n${inlinedCSS}    </style>`
  )
  .replace(
    '<script src="scripts/main.js"></script>\n    <script src="scripts/demos.js"></script>',
    `<script>\n${inlinedJS}    </script>`
  );

// Backup original and write the combined file as main index.html
if (fs.existsSync('index.html') && !fs.existsSync('index-dev.html')) {
  fs.copyFileSync('index.html', 'index-dev.html');
}

fs.writeFileSync('index.html', finalHTML);
console.log('✅ Built index.html with all slides embedded');
console.log('📁 Just open index.html directly in your browser');
console.log('🚀 Individual slide files in slides/ folder for parallel development');
console.log('💡 Original multi-file version saved as index-dev.html');