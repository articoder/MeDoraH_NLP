---
name: react-component
description: Create new React components following the LLM Hermeneutic Workbench patterns. Use when adding a "new component", "new UI element", "new panel", or "new modal" to the application.
---

# React Component Creation

## Purpose

This skill defines how to create new React components following the established patterns in the LLM Hermeneutic Workbench application. All components follow a consistent folder structure with TypeScript and CSS.

## When to Use

- User asks to "create a new component"
- User wants to "add a new panel", "modal", or "UI element"
- User needs to "extract code into a component"
- User asks for "component scaffolding"

## Instructions

### 1. Create Component Folder Structure

Each component lives in `hermeneutic-workbench/src/components/<ComponentName>/`:

```
hermeneutic-workbench/src/components/
├── NewComponent/
│   ├── index.ts          # Re-export for clean imports
│   ├── NewComponent.tsx  # Component implementation
│   └── NewComponent.css  # Component styles
```

### 2. Create the Component File

File: `hermeneutic-workbench/src/components/<Name>/<Name>.tsx`

```tsx
/**
 * <ComponentName> - Brief description
 */
import './<ComponentName>.css';

interface <ComponentName>Props {
  // Define props with TypeScript types
}

export function <ComponentName>({ ...props }: <ComponentName>Props) {
  return (
    <div className="<component-name>">
      {/* Component content */}
    </div>
  );
}
```

### 3. Create the Index File

File: `hermeneutic-workbench/src/components/<Name>/index.ts`

```typescript
export { <ComponentName> } from './<ComponentName>';
```

### 4. Create the CSS File

File: `hermeneutic-workbench/src/components/<Name>/<Name>.css`

```css
/* <ComponentName> styles */
.<component-name> {
  /* Use CSS variables from design-tokens.css */
}
```

### 5. Import in Parent Component

```tsx
import { <ComponentName> } from './components/<ComponentName>';
```

## Examples

### Existing Components to Reference

| Component | Location | Pattern |
|-----------|----------|---------|
| AppBar | `src/components/AppBar/` | Top navigation with buttons |
| Sidebar | `src/components/Sidebar/` | Panel with collapsible sections |
| GlobalSummary | `src/components/GlobalSummary/` | Stats cards with AnimatedNumber |
| NetworkModal | `src/components/NetworkModal/` | Full-screen modal with vis-network |

### Sample: Simple Panel Component

```tsx
// src/components/InfoPanel/InfoPanel.tsx
/**
 * InfoPanel - Displays contextual information
 */
import './InfoPanel.css';

interface InfoPanelProps {
  title: string;
  content: string;
}

export function InfoPanel({ title, content }: InfoPanelProps) {
  return (
    <div className="info-panel">
      <h3 className="info-panel-title">{title}</h3>
      <p className="info-panel-content">{content}</p>
    </div>
  );
}
```

---

## Performance Optimization Rules

Based on Vercel's React Best Practices (prioritized by impact):

### Re-render Optimization (MEDIUM Priority)

| Rule | Pattern |
|------|---------|
| `rerender-memo` | Extract expensive components and wrap with `React.memo()` |
| `rerender-dependencies` | Use primitive values in `useEffect`/`useMemo` dependencies |
| `rerender-derived-state` | Subscribe to derived booleans, not raw values |
| `rerender-functional-setstate` | Use functional `setState(prev => ...)` for stable callbacks |
| `rerender-lazy-state-init` | Pass function to `useState(() => expensiveValue)` for expensive initial values |

```tsx
// ❌ Bad: Re-renders on every object change
const { data } = useStore();
const hasData = data.length > 0; // derives boolean every render

// ✅ Good: Subscribe to derived boolean
const hasData = useStore((state) => state.data.length > 0);
```

### Rendering Performance (MEDIUM Priority)

| Rule | Pattern |
|------|---------|
| `rendering-hoist-jsx` | Extract static JSX outside component functions |
| `rendering-conditional-render` | Use ternary `? :` instead of `&&` for conditionals |
| `rendering-content-visibility` | Use `content-visibility: auto` for long lists (>50 items) |

```tsx
// ❌ Bad: Risky conditional rendering
{items.length && <List items={items} />}

// ✅ Good: Explicit ternary
{items.length > 0 ? <List items={items} /> : null}
```

### Bundle Size Optimization (CRITICAL Priority)

| Rule | Pattern |
|------|---------|
| `bundle-barrel-imports` | Import directly from files, avoid barrel (`index.ts`) re-exports |
| `bundle-dynamic-imports` | Use `React.lazy()` for heavy components not needed on initial load |

```tsx
// ❌ Bad: Barrel import
import { NetworkModal } from './components';

// ✅ Good: Direct import
import { NetworkModal } from './components/NetworkModal/NetworkModal';
```

---

## Accessibility Requirements

Based on Vercel's Web Interface Guidelines:

### Focus States (Required)

```tsx
// Every interactive element needs visible focus
<button className="btn">Click me</button>
```

```css
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Never: outline: none; without replacement */
```

### Buttons & Links

| Requirement | Implementation |
|-------------|----------------|
| Icon buttons | Must have `aria-label` |
| Click handlers | Use `<button>` not `<div onClick>` |
| Navigation | Use `<a>` or React Router `<Link>` for navigation |

```tsx
// ❌ Bad: Div with click handler
<div onClick={handleClick}>Click me</div>

// ✅ Good: Semantic button
<button onClick={handleClick} aria-label="Close modal">
  <XIcon />
</button>
```

### Forms

| Requirement | Pattern |
|-------------|---------|
| Inputs need labels | Use `<label htmlFor>` or wrap input |
| Correct input types | `type="email"`, `type="tel"`, etc. |
| Autocomplete | Set meaningful `autocomplete` and `name` attributes |
| Never block paste | No `onPaste` + `preventDefault` |

```tsx
<label htmlFor="search-input">Search</label>
<input 
  id="search-input"
  type="search"
  name="search"
  autoComplete="off"
  spellCheck={false}
/>
```

---

## Animation Guidelines

### Compositor-Friendly Animations

```css
/* ✅ Good: Only animate transform/opacity */
.component {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

/* ❌ Bad: Animates layout properties */
.component {
  transition: all 0.2s ease; /* Never use 'all' */
  transition: width 0.2s ease; /* Causes layout */
}
```

### Respect User Preferences

```css
@media (prefers-reduced-motion: reduce) {
  .component {
    transition: none;
    animation: none;
  }
}
```

---

## Common Pitfalls

1. **Forgetting index.ts**: Always create for clean imports
2. **Inline styles**: Use CSS files with design tokens instead
3. **Missing type definitions**: All props must be typed in interface
4. **CSS class naming**: Use kebab-case matching component name
5. **Icon buttons without aria-label**: Always add accessible labels
6. **Using `&&` for rendering**: Use ternary to avoid falsy value bugs
7. **Subscribing to entire store**: Use selectors to avoid re-renders

## Verification

1. Component compiles without TypeScript errors
2. `npm run dev` shows no console errors
3. Component renders correctly in UI
4. CSS classes apply as expected
5. Focus states visible when tabbing
6. No accessibility warnings in browser DevTools
