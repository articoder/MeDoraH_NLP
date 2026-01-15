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
}

.my-panel-content {
    font-family: var(--font-body);
    line-height: 1.6;
}
```

## Common Pitfalls

1. **Hardcoded colors**: Always use CSS variables
2. **Wrong import order**: `app.css` must be first (contains font imports)
3. **Missing transitions**: Add `transition` for hover/active states
4. **Forgetting responsive**: Test at different viewport sizes

## Verification

1. `npm run dev` - no CSS errors in console
2. Visual inspection matches existing design
3. CSS variables resolve (check in browser DevTools)
4. Hover/active states work smoothly
