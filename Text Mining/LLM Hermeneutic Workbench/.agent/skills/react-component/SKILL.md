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

## Common Pitfalls

1. **Forgetting index.ts**: Always create for clean imports
2. **Inline styles**: Use CSS files with design tokens instead
3. **Missing type definitions**: All props must be typed in interface
4. **CSS class naming**: Use kebab-case matching component name

## Verification

1. Component compiles without TypeScript errors
2. `npm run dev` shows no console errors
3. Component renders correctly in UI
4. CSS classes apply as expected
