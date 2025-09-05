# Agents.md

This file provides guidance to OpenAI Codex agent when working with code in this repository.

## Project Overview

This repository contains HTML landing pages for digital oral history research projects:
- `digital_oralhistory_landing_page.html` - Main International Digital Oral History Lab landing page with comprehensive styling
- `hiddenhistory_landingpage.html` - Hidden Histories project page with embedded styles
- `MeDoraH_landingpage.html` - MeDoraH project page with embedded styles and brand-specific color palette
- `Multimodal_Digital_Oral_History_landingpage.html` - Empty file for future content
- `Resources & Publications.html` - Academic publications and resources page with grid layout and navigation
- `Research Team.html` - Research team and staff profiles page
- `Projects.html` - Comprehensive projects overview with Hidden Histories, MDOH, and MeDoraH
- `CSS_template.css` - Comprehensive CSS framework template for future projects

## No Build System Required

This is a static HTML project with no build tools, package managers, or dependencies. All styling is embedded directly in HTML files or referenced via the CSS template. To view pages, simply open HTML files in a browser.

## Architecture & Structure

### Main Landing Page (`digital_oralhistory_landing_page.html`)
- Self-contained HTML file with embedded CSS
- Uses CSS custom properties (variables) for consistent theming
- Responsive design with mobile-first approach
- Anthropic-inspired color palette and typography
- Sections: Hero, Cards (Research/Education/Community), Mission, Footer
- JavaScript animations for tagline words with staggered fade-in effects
- External image dependencies from hiddenhistories.net

### Design System
- **Typography**: IBM Plex Sans (primary), Instrument Serif (secondary)  
- **Colors**: Neutral palette with coral (#E4725B), blue (#4A5568), and sage (#8B9A7B) accents
- **Spacing**: CSS custom properties with consistent scale (--space-xs to --space-4xl)
- **Components**: Reusable button styles (.btn-primary, .btn-secondary), card layouts, visual elements

### Resources & Publications Page (`Resources & Publications.html`)
- Advanced layout with sticky sidebar navigation and grid-based content
- CSS custom properties for responsive design and consistent spacing
- Publication cards with image covers, titles, and descriptions
- Year-based organization for talks section with `.year-indicator` styling
- Two-column grid layout (sidebar + main content) that collapses on mobile

### CSS Framework Template (`CSS_template.css`)
- **Mobile-first approach** with responsive breakpoints
- **Container system** with multiple sizes (narrow, medium, wide, full) and max-width up to 1600px
- **CSS custom properties** for consistent theming and responsive scaling
- **Animation library** including fadeIn, slideIn, float, pulse, and scroll-triggered animations
- **Comprehensive component styles** for buttons, cards, typography, and layouts
- **Accessibility features** including focus states, reduced motion support, and touch targets
- **Grid systems** for cards (1-4 columns) and team layouts
- **Omeka-S integration** with CSS overrides for content management system

### Project-Specific Pages
- `hiddenhistory_landingpage.html` - Hidden Histories project with embedded brand-consistent styles
- `MeDoraH_landingpage.html` - MeDoraH project with unique teal/green color palette and semantic web focus
- `Projects.html` - Interactive project timeline showing relationships between Hidden Histories, MDOH, and MeDoraH
- All pages use embedded CSS with consistent design patterns and responsive layouts

## Common Development Tasks

### Styling Changes
- Main styling is embedded in `digital_oralhistory_landing_page.html` within `<style>` tags
- Resources page has embedded styles with CSS grid and responsive design patterns
- Use CSS custom properties for consistent theming modifications
- Responsive breakpoints: 1024px (tablet), 768px (mobile)
- Publication cards use hover effects and consistent spacing patterns

### Content Updates  
- Hero section content in `.hero-content`
- Project cards in `.cards-grid` 
- Mission statement in `.mission-content`
- All external links point to hiddenhistories.net domain

### Adding New Pages
- **Use CSS template**: Link to `CSS_template.css` for new projects with comprehensive framework
- **Standalone approach**: Embed styles similar to the main landing page for self-contained pages
- **Responsive considerations**: Template provides mobile-first breakpoints and container systems
- **Animation integration**: Use predefined animation classes from template (.fade-in, .float-animation, etc.)

### Working with CSS Template
- **Container classes**: Use `.container`, `.container-narrow`, `.container-wide` for different layouts
- **Grid systems**: `.cards-grid`, `.cards-grid-3`, `.team-grid` for responsive layouts
- **Animation classes**: `.fade-in`, `.slide-in`, `.float-animation`, `.scroll-fade-in`
- **Utility classes**: Text alignment, spacing utilities (mt-1 through mt-5, mb-1 through mb-5)
- **Component classes**: `.btn-primary`, `.btn-secondary`, `.card`, `.profile-card`

## Design Philosophy & Standards

### UI/UX Design Approach
This project follows world-class design principles for academic digital humanities interfaces:

**Brand Excellence**
- Position Hidden Histories, MeDoraH, and MDOH as pioneering examples of academic digital collections
- Blend scholarly rigor with contemporary design sensibilities
- Create interfaces that rival leading tech companies while maintaining academic authority
- Transform oral histories into compelling visual narratives

**Core Design Principles**
1. **Humanistic Minimalism**: Strip away complexity while preserving human stories
2. **Semantic Beauty**: Let information structure guide visual hierarchy 
3. **Thoughtful Interactions**: Every interaction should feel intentional and meaningful
4. **Accessible Excellence**: Inclusive design enhances aesthetic quality

### Interaction Standards
- **Hover States**: Subtle elevation changes and organic color shifts
- **Loading States**: Skeleton screens maintaining layout integrity
- **Transitions**: Smooth animations using CSS custom properties
- **Micro-interactions**: Thoughtful feedback (bookmark saves, transcript highlights)

### Implementation Guidelines
- Use existing CSS custom properties for consistent theming
- Maintain responsive design patterns (mobile-first approach)
- Preserve accessibility while enhancing visual appeal
- Follow established color palette and typography system

## External Dependencies
- Google Fonts: IBM Plex Sans, Instrument Serif, Inter
- Images hosted on hiddenhistories.net
- External publication cover images from various academic publishers
- SVG icons and graphics embedded directly in HTML

## Brand Color Palettes

### Main Lab (coral-focused)
- Primary: #E4725B (coral), #4A5568 (blue), #8B9A7B (sage)
- Background: #F7F5F2 (warm neutral)

### MeDoraH (teal-focused) 
- Primary: #2E7D8F (deep teal), #5BA0B4 (lighter teal), #8BC34A (fresh green)
- Background: #F4F6F8 (cool neutral)

### Hidden Histories (coral-consistent)
- Matches main lab palette for brand consistency

## Omeka-S Defensive Programming Guidelines

### 1. Understanding Omeka-S Technical Constraint Layers

**First Layer: Omeka-S HTML Purifier (Filter)**
- Remove "dangerous" tags and attributes
- Restructure "invalid" HTML nesting

**Second Layer: Omeka-S Theme Layer**
- Global CSS rules may override custom styles
- JavaScript event delegation may cause conflicts

**Third Layer: Browser Security Policies**
- CSP (Content Security Policy) restrictions
- CORS limitations

### 2. Defensive Programming Principles

**Principle 1: Assume HTML will be rewritten**
```html
<!-- ❌ Avoid: Complex nested structures -->
<a href="url">
  <div class="complex">
    <span>Content</span>
  </div>
</a>

<!-- ✅ Recommended: Simple semantic structure -->
<div data-link="url" class="clickable">
  <span>Content</span>
</div>
```

**Principle 2: Don't rely on default browser behavior**
```javascript
// ❌ Relying on default link behavior
<a href="page.html">Link</a>

// ✅ Explicit navigation control
element.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation(); // Prevent bubbling
  window.location.href = url; // or window.open()
});
```

**Principle 3: Separate data from presentation**
```html
<!-- Use data-* attributes to store dynamic information -->
<div class="card"
     data-url="/path/to/resource"
     data-type="external"
     data-id="123">
```

### 3. Technical Implementation Checklist

**HTML Level**
* ✅ Use **semantic but simple** HTML5 tags
* ✅ Avoid `<a>` wrapping block elements
* ✅ Use `data-*` attributes for metadata
* ✅ Add ARIA attributes for accessibility
* ❌ Avoid `<form>` tags (may be filtered by Omeka-S)
* ❌ Avoid inline event handlers (`onclick="..."`)

**CSS Level**
* ✅ Use **high specificity** selectors to prevent override
* ✅ Add `!important` to critical interaction styles
* ✅ Use CSS custom properties for theme integration
* ❌ Avoid depending on new features like `:has()`

**JavaScript Level**
```javascript
// Complete defensive event binding template
(function() {
  'use strict';
  
  // 1. Multiple initialization timings
  const initHandlers = () => {
    const elements = document.querySelectorAll('[data-action]');
    
    elements.forEach(el => {
      // 2. Check if already bound (prevent duplicates)
      if (el.dataset.bound) return;
      
      // 3. Multiple event binding approaches
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Strongest prevention
        // Execute action
      };
      
      // 4. Use multiple binding methods simultaneously
      el.addEventListener('click', handler, true); // Capture phase
      el.onclick = handler; // Fallback method
      
      el.dataset.bound = 'true';
    });
  };
  
  // 5. Multiple initialization safeguards
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHandlers);
  } else {
    initHandlers();
  }
  
  // 6. Delayed fallback initialization
  setTimeout(initHandlers, 1000);
  
  // 7. MutationObserver for DOM changes
  if (window.MutationObserver) {
    const observer = new MutationObserver(initHandlers);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
```