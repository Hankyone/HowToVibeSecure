# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive security presentation called "Vibe‑Coded App Security" - a fast, practical playbook for non-dev builders shipping AI-backed apps. It's a single-page interactive presentation with 16 slides and live security demonstrations, designed for 15-25 minute talks.

## Development Architecture

### Multi-File Development with Build System
The project uses a hybrid architecture that enables parallel development while maintaining file:// compatibility:

**Key Files:**
- `index.html` - Final combined presentation (auto-generated, works with file://)
- `index-dev.html` - Development template for dynamic loading
- `slides/` - Individual slide HTML files (01-intro.html through 16-resources.html)
- `build.js` - Combines slide files into main index.html
- `watch.js` - Auto-rebuilds on slide changes

### Development Commands
```bash
# Build the combined presentation
node build.js

# Start file watcher for auto-rebuild on changes
node watch.js

# Direct viewing (no server needed)
# Open index.html directly in browser
```

### Project Structure
- `index.html` - Combined presentation (auto-built from slides/)
- `slides/` - Individual slide files for parallel development
- `scripts/main.js` - Navigation, scroll handling, dynamic loading
- `scripts/demos.js` - All interactive security demonstrations
- `styles/main.css` - Core layout, navigation, themes
- `styles/slides.css` - Slide-specific styling
- `styles/demos.css` - Demo component styling

## Key Features

### Navigation System
- Smooth scroll-snap between 15+ slides
- Keyboard navigation (J/K, arrows, space, Home/End)
- Timeline progress indicator with interactive dots for each slide
- Auto-hiding UI that appears on interaction

### Interactive Security Demonstrations

#### Frontend vs Backend Demo (`frontend-backend`)
- DevTools button bypass demonstration
- Shows why server-side validation is critical
- Interactive examples of client-side security failures

#### XSS Protection Demo (`xss-demo`)
- Live XSS payload testing (safe environment)
- Secure vs insecure rendering comparison
- Sample payloads for demonstration

#### RLS (Row Level Security) Testing (`rls`, `rls-testing`)
- Multi-user access control simulation
- A/B user testing interface
- 3-step RLS verification process

#### Secrets Management Scanner (`secrets`)
- Real-time code scanning for potential secrets
- Pattern matching for API keys, tokens, passwords
- Sample vulnerable code for demonstration

#### Rate Limiting Demo (`api-limits`)
- Interactive API request simulation
- Rate limit enforcement visualization
- Request flooding demonstration

#### File Upload Validation (`storage`)
- MIME type and size validation
- Security extension checking
- Real-time file analysis

#### SSRF Protection Demo (`server-calls`)
- URL allowlist/blocklist testing
- Private IP range detection
- Sample dangerous URLs for testing

#### Security Headers Inspector (`cors-headers`)
- Current page header analysis
- Security header recommendations
- CSP and CORS configuration examples

## Content Structure

### Slides Overview
1. **Intro** - Project introduction and author info
2. **Mindset** - Default-deny security thinking with sticky rules
3. **Frontend vs Backend** - UX vs security authority demo
4. **AI Prompts** - How to request security features from AI
5. **Secrets Management** - Platform secrets and scanning
6. **RLS** - Row Level Security made simple
7. **XSS Demo** - Input validation and XSS protection
8. **API Limits** - Rate limiting and abuse controls
9. **CORS & Headers** - Security headers and CORS configuration
10. **Storage** - File upload security and validation
11. **Server Calls** - SSRF protection and API security
12. **Vulnerability Classes** - Lightning round of common vulns
13. **Keep Current** - Dependency management and updates
14. **RLS Testing** - 3-step testing methodology
15. **Checklist** - 10-minute hardening checklist
16. **Resources** - Links and copy-paste prompts

## Modular Demo System

The `scripts/demos.js` file contains individual demo initializers:
- `initFrontendBackendDemo()` - DevTools bypass demo
- `initSecretsDemo()` - Code scanning for secrets
- `initRLSDemo()` - User access control testing
- `initXSSDemo()` - XSS protection demonstration
- `initRateLimitDemo()` - API rate limiting simulation
- `initHeadersDemo()` - Security headers inspection
- `initUploadDemo()` - File upload validation
- `initSSRFDemo()` - SSRF protection testing
- `initRLSTestingDemo()` - Automated RLS testing

Each demo is self-contained and can be modified independently.

## Styling System

### Color Themes
Each slide has a unique color theme via `data-color` attribute:
- `blue` - Introduction, API limits, checklist
- `red` - Mindset, vulnerability classes  
- `violet` - Frontend/backend, XSS, RLS testing
- `indigo` - AI prompts, storage, resources
- `orange` - Secrets, CORS/headers
- `teal` - RLS, server calls
- `green` - Keep current

### Interactive Elements
- Consistent button styling (danger vs safe actions)
- Result panels with color-coded status (success/error/warning)
- Tabbed interfaces for multi-user scenarios
- Code blocks with monospace fonts
- Sample payload buttons for quick testing

## Important Considerations

### Security Focus
This is an educational security demonstration app:
- All "vulnerable" code is contained and safe for demonstration
- Clear visual distinction between secure and insecure examples
- Speaker notes provided for presentation context
- Real security patterns demonstrated in safe environment

## Development Workflow

### Making Changes
1. **Edit slides**: Modify individual files in `slides/` folder
2. **Auto-rebuild**: Run `node watch.js` for automatic rebuilds on file changes
3. **Manual build**: Run `node build.js` to manually combine slides
4. **View changes**: Refresh `index.html` in browser (no server required)

### File:// Compatibility
The build system ensures the presentation works when opened directly from the filesystem:
- All slides are embedded into a single `index.html`
- No external HTTP requests or dynamic imports
- CSS and JavaScript are included or inlined
- Works in any modern browser without a server

### Parallel Development
The slide system enables multiple developers to work simultaneously:
- Each slide is a separate HTML file
- Independent editing without conflicts
- Modular CSS structure (main.css, slides.css, demos.css)
- Self-contained demo functionality

### Dark Theme & Modern Design
- Dark cyberpunk-inspired theme with neon accents
- Gradient backgrounds and glowing effects
- Smooth animations and hover transitions
- High contrast for readability and projection