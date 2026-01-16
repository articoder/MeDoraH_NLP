---
name: web-interface-guidelines
description: Review UI code for accessibility and UX compliance. Use when asked to "review UI", "check accessibility", "audit design", "review UX", or "check against best practices".
---

# Web Interface Guidelines

UI/UX compliance checklist for reviewing web interfaces. Based on Vercel's Web Interface Guidelines.

## When to Use

- User asks to "review my UI"
- User wants to "check accessibility"
- User needs to "audit design"
- User asks for "UX review"

---

## Focus States

| Requirement | Implementation |
|-------------|----------------|
| Visible focus | `focus-visible:ring-*` or equivalent |
| Never remove outline | No `outline: none` without replacement |
| Prefer `:focus-visible` | Avoids focus ring on mouse click |
| Compound controls | Use `:focus-within` |

```css
/* ✅ Good */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ❌ Bad */
button:focus {
  outline: none;
}
```

---

## Forms

| Requirement | Implementation |
|-------------|----------------|
| Inputs need labels | `<label htmlFor>` or wrapping |
| Correct input types | `email`, `tel`, `url`, `number` |
| Autocomplete | Set meaningful `autocomplete` and `name` |
| Never block paste | No `onPaste` + `preventDefault` |
| Disable spellcheck | `spellCheck={false}` on emails, codes, usernames |
| Submit button state | Enabled until request starts, spinner during |
| Error placement | Inline next to fields, focus first error |
| Placeholders | End with `…`, show example pattern |

---

## Animation

| Requirement | Implementation |
|-------------|----------------|
| Honor reduced motion | `@media (prefers-reduced-motion: reduce)` |
| Compositor-only | Animate only `transform`/`opacity` |
| Never `transition: all` | List properties explicitly |
| Interruptible | Respond to user input mid-animation |
| SVG transforms | Wrap in `<div>`, use `transform-box: fill-box` |

---

## Typography

| Use | Avoid |
|-----|-------|
| `…` (ellipsis) | `...` (three dots) |
| `"` `"` (curly quotes) | `"` (straight quotes) |
| `–` (en-dash for ranges) | `-` (hyphen) |
| `font-variant-numeric: tabular-nums` | Default proportional for tabular data |
| `text-wrap: balance` | Widows on headings |

Loading states should end with `…`: `"Loading…"`, `"Saving…"`

---

## Content Handling

| Requirement | Implementation |
|-------------|----------------|
| Long text | `truncate`, `line-clamp-*`, or `break-words` |
| Flex children | Need `min-w-0` to allow truncation |
| Empty states | Handle gracefully, don't render broken UI |
| User content | Anticipate short, average, and very long inputs |

---

## Images

| Requirement | Implementation |
|-------------|----------------|
| Explicit dimensions | `width` and `height` attributes (prevents CLS) |
| Below-fold | `loading="lazy"` |
| Above-fold critical | `priority` or `fetchpriority="high"` |

---

## Performance

| Requirement | Implementation |
|-------------|----------------|
| Large lists (>50) | Virtualize (`virtua`, `content-visibility: auto`) |
| No layout reads in render | Avoid `getBoundingClientRect`, `offsetHeight` |
| Batch DOM reads/writes | Avoid interleaving |
| Uncontrolled inputs | Prefer over controlled when possible |
| Preconnect | Add `<link rel="preconnect">` for CDN domains |

---

## Navigation & State

| Requirement | Implementation |
|-------------|----------------|
| URL reflects state | Filters, tabs, pagination in query params |
| Links support Cmd+click | Use `<a>` or React Router `<Link>` |
| Deep-link stateful UI | Consider URL sync (nuqs or similar) |
| Destructive actions | Confirmation modal or undo window |

---

## Touch & Interaction

| Requirement | Implementation |
|-------------|----------------|
| No double-tap delay | `touch-action: manipulation` |
| Modal scroll containment | `overscroll-behavior: contain` |
| During drag | Disable text selection, `inert` on dragged elements |
| AutoFocus | Desktop only, single primary input |

---

## Dark Mode & Theming

| Requirement | Implementation |
|-------------|----------------|
| System integration | `color-scheme: dark` on `<html>` |
| Meta theme color | `<meta name="theme-color">` matches background |
| Native inputs | Explicit `background-color` and `color` |

---

## Hydration Safety

| Requirement | Implementation |
|-------------|----------------|
| Controlled inputs | Need `onChange` or use `defaultValue` |
| Date/time rendering | Guard against server/client mismatch |
| `suppressHydrationWarning` | Only where truly needed |

---

## Anti-Patterns (Flag These)

| Anti-Pattern | Issue |
|--------------|-------|
| `user-scalable=no` | Disables accessibility zoom |
| `maximum-scale=1` | Disables accessibility zoom |
| `onPaste` + `preventDefault` | Breaks paste functionality |
| `transition: all` | Performance issue |
| `outline-none` without replacement | Accessibility violation |
| Inline `onClick` without `<a>` | No Cmd+click support |
| `<div>` or `<span>` with click handlers | Should be `<button>` |
| Images without dimensions | Causes CLS |
| Large array `.map()` without virtualization | Performance issue |
| Form inputs without labels | Accessibility violation |
| Icon buttons without `aria-label` | Accessibility violation |
| Hardcoded date/number formats | Use `Intl.*` |
| `autoFocus` without justification | Mobile keyboard popup |

---

## Output Format

When reviewing files, output findings in terse `file:line` format:

```text
## src/components/Button.tsx

src/components/Button.tsx:42 - icon button missing aria-label
src/components/Button.tsx:18 - input lacks label
src/components/Button.tsx:55 - animation missing prefers-reduced-motion
src/components/Button.tsx:67 - transition: all → list properties

## src/components/Modal.tsx

src/components/Modal.tsx:12 - missing overscroll-behavior: contain
src/components/Modal.tsx:34 - "..." → "…"

## src/components/Card.tsx

✓ pass
```

---

## Verification

1. Tab through interface - focus states visible everywhere
2. Test with screen reader - all interactive elements announced
3. Test with `prefers-reduced-motion` - animations respect preference
4. Review in dark mode - all text readable, inputs styled
5. Check mobile - no zoom disabled, proper touch targets
