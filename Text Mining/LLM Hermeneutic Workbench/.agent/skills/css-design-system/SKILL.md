---
name: css-design-system
description: Add styles following the design-tokens.css conventions. Use when "styling components", "adding CSS", or modifying the "visual design" of the application.
---

# CSS Design System

## Purpose

This skill explains the CSS architecture and design token system used in the LLM Hermeneutic Workbench. All styles use vanilla CSS with CSS custom properties (variables).

## When to Use

- User needs to "style a component"
- User wants to "add CSS" or "modify styles"
- User asks about "colors", "typography", or "spacing"
- User wants to "match the design system"

## Instructions

### Style Files

| File | Purpose |
|------|---------|
| `src/styles/design-tokens.css` | CSS variables (colors, fonts, spacing) |
| `src/styles/app.css` | Layout, fonts, global styles |
| `src/styles/components.css` | Shared component styles |
| `src/styles/network-modal.css` | Network visualization styles |
| `src/components/*/Component.css` | Component-specific styles |

### Import Order (Critical!)

In `App.tsx`, CSS must be imported in this order:

```tsx
import './styles/app.css';          // First - contains @import for fonts
import './styles/design-tokens.css';
import './styles/components.css';
import './styles/network-modal.css';
```

### Design Tokens

#### Colors

```css
/* Primary palette */
--color-primary: #3A87FD;
--color-secondary: #E07C3A;

/* Entity badge colors by frequency */
--badge-high-bg: rgba(59, 130, 246, 0.15);     /* Blue - high freq */
--badge-medium-bg: rgba(245, 158, 11, 0.15);   /* Orange - medium */
--badge-low-bg: rgba(16, 185, 129, 0.15);      /* Green - low */
```

#### Typography

```css
--font-body: 'Inter', -apple-system, sans-serif;
--font-ui: 'PT Sans Narrow', sans-serif;
```

#### Spacing

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;

--border-radius: 12px;
--border-radius-sm: 8px;
```

### Using Tokens in CSS

```css
.my-component {
    padding: var(--spacing-md);
    background: var(--color-background);
    border-radius: var(--border-radius);
    font-family: var(--font-body);
}

.my-component:hover {
    background: var(--color-hover);
}
```

### Common Patterns

#### Card Style

```css
.card {
    background: var(--color-surface);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-md);
}
```

#### Badge Style (Entity Types)

```css
.badge {
    display: inline-flex;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    font-size: 0.85rem;
    cursor: pointer;
    transition: transform 0.15s ease;
}

.badge:hover {
    transform: translateY(-1px);
}

.badge-high { background: var(--badge-high-bg); }
.badge-medium { background: var(--badge-medium-bg); }
.badge-low { background: var(--badge-low-bg); }
```

#### Button Style

```css
.btn {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-sm);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-primary {
    background: var(--color-primary);
    color: white;
}

.btn-primary:hover {
    background: var(--color-primary-hover);
}
```

---

## Animation Rules

Based on Vercel's Web Interface Guidelines:

### Compositor-Friendly Animations

Only animate properties that don't trigger layout recalculation:

```css
/* ✅ Good: Only transform and opacity */
.element {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.element:hover {
    transform: translateY(-2px);
    opacity: 0.9;
}

/* ❌ Bad: Layout-triggering properties */
.element {
    transition: all 0.2s ease; /* NEVER use 'all' */
    transition: width 0.2s ease; /* Causes layout */
    transition: height 0.2s ease; /* Causes layout */
}
```

### Respect Reduced Motion Preference

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### SVG Animation

```css
/* For SVG animations, wrap in a div and animate the wrapper */
.svg-wrapper {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 0.2s ease;
}
```

### Animation Must Be Interruptible

Animations should respond to user input mid-animation. Avoid animations that lock interaction.

---

## Typography Guidelines

Based on Vercel's Web Interface Guidelines:

### Punctuation

| Use | Avoid |
|-----|-------|
| `…` (ellipsis character) | `...` (three dots) |
| `"` `"` (curly quotes) | `"` `"` (straight quotes) |
| `–` (en-dash for ranges) | `-` (hyphen for ranges) |

### Loading States

```css
/* Loading text should end with ellipsis */
.loading-text::after {
    content: "…"; /* Not "..." */
}
```

### Number Display

```css
/* Use tabular numbers for numeric columns */
.stats-number {
    font-variant-numeric: tabular-nums;
}
```

### Heading Text Wrap

```css
/* Prevent widows in headings */
h1, h2, h3 {
    text-wrap: balance;
}
```

### Non-Breaking Spaces

Use `&nbsp;` for:
- Units: `10&nbsp;MB`, `5&nbsp;sec`
- Keyboard shortcuts: `⌘&nbsp;K`
- Brand names that shouldn't break

---

## Content Handling

### Text Truncation

```css
/* Single line truncation */
.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Multi-line truncation */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* CRITICAL: Flex children need min-w-0 to allow truncation */
.flex-child {
    min-width: 0;
}
```

### Empty States

Always style empty states - never render broken UI for empty arrays/strings:

```css
.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
    font-style: italic;
}
```

---

## Dark Mode & Theming

### System Integration

```css
/* Set on html element for system integration */
html[data-theme="dark"] {
    color-scheme: dark;
}
```

### Input Styling

```css
/* Native inputs need explicit colors in dark mode (Windows) */
input, select, textarea {
    background-color: var(--color-surface);
    color: var(--color-text);
}
```

### Meta Theme Color

```html
<!-- Match page background for mobile browser chrome -->
<meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
```

---

## Focus States

Never remove focus outlines without providing a replacement:

```css
/* ✅ Good: Custom focus-visible style */
button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* ❌ Bad: Removes focus with no replacement */
button:focus {
    outline: none;
}

/* Use :focus-visible over :focus (avoids focus ring on click) */
```

---

## Examples

### Styling a New Panel

```css
/* src/components/MyPanel/MyPanel.css */
.my-panel {
    background: var(--color-surface);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
}

.my-panel-title {
    font-family: var(--font-ui);
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
    text-wrap: balance;
}

.my-panel-content {
    font-family: var(--font-body);
    line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
    .my-panel {
        transition: none;
    }
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| `transition: all` | List properties explicitly |
| `outline: none` without replacement | Use `:focus-visible` with custom outline |
| Hardcoded colors | Use CSS variables |
| Missing dark mode colors | Test with both themes |
| Images without dimensions | Always set `width` and `height` |
| `...` for ellipsis | Use `…` character |

---

## Common Pitfalls

1. **Hardcoded colors**: Always use CSS variables
2. **Wrong import order**: `app.css` must be first (contains font imports)
3. **Missing transitions**: Add `transition` for hover/active states
4. **Forgetting responsive**: Test at different viewport sizes
5. **Using `transition: all`**: List specific properties instead
6. **Ignoring reduced-motion**: Wrap animations in media query

## Verification

1. `npm run dev` - no CSS errors in console
2. Visual inspection matches existing design
3. CSS variables resolve (check in browser DevTools)
4. Hover/active states work smoothly
5. Focus states visible when tabbing
6. Reduced-motion preference respected
