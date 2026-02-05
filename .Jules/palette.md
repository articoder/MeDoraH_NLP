## 2026-02-05 - Semantic Structure and Accessibility in Omeka-S Templates
**Learning:** Static HTML templates designed for CMS integration (like Omeka-S) often omit critical top-level semantic elements (like `<title>` or `<h1>`) because they are expected to be provided by the host environment. However, when these templates are served or viewed independently, their absence leads to poor UX and accessibility.
**Action:** Always verify that landing pages have unique `<title>` tags and at least one `<h1>` even if they are components, or ensure they degrade gracefully.

## 2026-02-05 - Replacing Inline Hover JS with CSS
**Learning:** The project uses inline `onmouseover`/`onmouseout` for micro-animations (like arrow shifts). This violates the repo's defensive programming guidelines and is less performant than CSS.
**Action:** Replace inline JS hover effects with CSS transitions on parent hover or focused states to improve maintainability and adherence to Omeka-S best practices.
