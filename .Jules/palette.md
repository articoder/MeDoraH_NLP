## 2026-02-03 - [Accessible Contact Reveal Pattern]
**Learning:** For interactive "reveal" patterns like email address buttons, mouse hover events are insufficient. Using both `mouseenter`/`mouseleave` and `focus`/`blur` ensures keyboard accessibility. Additionally, dynamic `aria-label` updates provide critical context for screen reader users when information is revealed.
**Action:** Always pair hover listeners with focus listeners for reveal interactions, and use `aria-live` for clipboard feedback.

## 2026-02-03 - [Skip to Content Implementation]
**Learning:** Skip to Content links must have a high z-index to ensure they appear above positioned header elements when focused, even if they are the first element in the DOM.
**Action:** Include `z-index: 9999` (or a high project-specific value) on skip links in the global CSS template.
