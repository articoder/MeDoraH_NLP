# Palette's Journal

## 2025-05-14 - Keyboard Accessibility for Reveal-on-Hover Elements
**Learning:** Interactive elements that only respond to hover (like the "Contact" email reveal in Research Team.html) are inaccessible to keyboard users and screen readers. Using `focus-visible` for styling and adding `focus`/`blur` event listeners is critical for parity. Additionally, ARIA live regions are necessary for dynamic feedback like "Copied to clipboard".
**Action:** Always include focus states and ARIA live regions for custom interactive components that provide visual-only feedback.
