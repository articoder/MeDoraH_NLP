---
name: react-best-practices
description: Apply React/Next.js performance optimization rules. Use when asked to "optimize performance", "review for performance", "improve rendering", or apply "best practices" to React code.
---

# React Best Practices

Comprehensive performance optimization guide for React applications, based on Vercel's 45 rules across 8 priority categories.

## When to Use

- User asks to "optimize performance"
- User wants to "review code for performance issues"
- User needs to "refactor for better performance"
- User asks about "re-renders", "bundle size", or "load times"

---

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

---

## 1. Eliminating Waterfalls (CRITICAL)

Sequential data fetching that blocks rendering.

| Rule | Pattern |
|------|---------|
| `async-parallel` | Use `Promise.all()` for independent operations |
| `async-defer-await` | Move `await` into branches where actually used |
| `async-suspense-boundaries` | Use `<Suspense>` to stream content |

```tsx
// ❌ Bad: Sequential waterfall
const user = await getUser(id);
const posts = await getPosts(user.id);
const comments = await getComments(posts[0].id);

// ✅ Good: Parallel fetching
const [user, posts] = await Promise.all([
  getUser(id),
  getPosts(id)
]);
```

---

## 2. Bundle Size Optimization (CRITICAL)

Reducing initial JavaScript payload.

| Rule | Pattern |
|------|---------|
| `bundle-barrel-imports` | Import directly, avoid barrel (`index.ts`) files |
| `bundle-dynamic-imports` | Use `React.lazy()` for heavy components |
| `bundle-defer-third-party` | Load analytics/logging after hydration |
| `bundle-preload` | Preload on hover/focus for perceived speed |

```tsx
// ❌ Bad: Barrel import loads entire module
import { NetworkModal } from './components';

// ✅ Good: Direct import, tree-shakeable
import { NetworkModal } from './components/NetworkModal/NetworkModal';

// ✅ Good: Lazy load heavy components
const NetworkModal = React.lazy(() => import('./components/NetworkModal'));
```

---

## 3. Server-Side Performance (HIGH)

Optimizing data fetching and serialization.

| Rule | Pattern |
|------|---------|
| `server-cache-react` | Use `React.cache()` for per-request deduplication |
| `server-serialization` | Minimize data passed to client components |
| `server-parallel-fetching` | Restructure components to parallelize fetches |

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

Efficient data fetching on the client.

| Rule | Pattern |
|------|---------|
| `client-swr-dedup` | Use SWR for automatic request deduplication |
| `client-event-listeners` | Deduplicate global event listeners |

---

## 5. Re-render Optimization (MEDIUM)

Preventing unnecessary component updates.

| Rule | Pattern |
|------|---------|
| `rerender-memo` | Extract expensive work into memoized components |
| `rerender-dependencies` | Use primitive dependencies in effects |
| `rerender-derived-state` | Subscribe to derived booleans, not raw values |
| `rerender-functional-setstate` | Use functional `setState` for stable callbacks |
| `rerender-lazy-state-init` | Pass function to `useState` for expensive values |
| `rerender-transitions` | Use `startTransition` for non-urgent updates |

```tsx
// ❌ Bad: Re-renders on every object change
const { data } = useStore();
const hasData = data.length > 0;

// ✅ Good: Only re-renders when boolean changes
const hasData = useStore((state) => state.data.length > 0);
```

```tsx
// ❌ Bad: Object dependency changes every render
useEffect(() => {
  // ...
}, [options]); // options = { page, limit }

// ✅ Good: Primitive dependencies
useEffect(() => {
  // ...
}, [options.page, options.limit]);
```

---

## 6. Rendering Performance (MEDIUM)

Optimizing the render phase.

| Rule | Pattern |
|------|---------|
| `rendering-hoist-jsx` | Extract static JSX outside components |
| `rendering-content-visibility` | Use `content-visibility: auto` for long lists |
| `rendering-conditional-render` | Use ternary `? :` instead of `&&` |
| `rendering-hydration-no-flicker` | Use inline script for client-only data |

```tsx
// ❌ Bad: Risky conditional (0 && renders "0")
{items.length && <List items={items} />}

// ✅ Good: Explicit boolean check
{items.length > 0 ? <List items={items} /> : null}
```

```tsx
// ✅ Hoist static JSX
const LOADING_INDICATOR = <Spinner />;

function Component() {
  if (isLoading) return LOADING_INDICATOR;
  // ...
}
```

---

## 7. JavaScript Performance (LOW-MEDIUM)

General JS optimization patterns.

| Rule | Pattern |
|------|---------|
| `js-batch-dom-css` | Group CSS changes via classes or `cssText` |
| `js-index-maps` | Build `Map` for repeated lookups |
| `js-cache-property-access` | Cache object properties in loops |
| `js-combine-iterations` | Combine multiple `filter/map` into one loop |
| `js-set-map-lookups` | Use `Set/Map` for O(1) lookups |
| `js-early-exit` | Return early from functions |

```tsx
// ❌ Bad: O(n) lookup each time
items.filter(item => selectedIds.includes(item.id))

// ✅ Good: O(1) lookup with Set
const selectedSet = new Set(selectedIds);
items.filter(item => selectedSet.has(item.id))
```

---

## 8. Advanced Patterns (LOW)

Specialized optimization techniques.

| Rule | Pattern |
|------|---------|
| `advanced-event-handler-refs` | Store event handlers in refs |
| `advanced-use-latest` | `useLatest` for stable callback refs |

---

## Quick Checklist

When reviewing React code for performance:

- [ ] No sequential `await` when operations are independent
- [ ] Heavy components use `React.lazy()`
- [ ] No barrel file imports
- [ ] Zustand selectors return primitives/derived values
- [ ] `useEffect` dependencies are primitives
- [ ] No `&&` conditional rendering with numbers
- [ ] Long lists use virtualization or `content-visibility`
- [ ] No `setState` depending on current state without functional form

---

## Verification

1. `npm run build` - check bundle size hasn't increased unexpectedly
2. React DevTools Profiler - verify reduced re-renders
3. Network tab - confirm parallel requests
4. Lighthouse - validate performance score
