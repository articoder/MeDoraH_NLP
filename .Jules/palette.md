# Palette's Journal - UX & Accessibility Learnings

## 2025-05-15 - Accessible Email Reveal Pattern
**Learning:** Interactive "reveal" patterns (like showing an email on hover) are often inaccessible to keyboard and screen reader users. To fix this, use both `focus`/`blur` JS listeners for visual reveal and dynamic `aria-label` updates to provide context and feedback (e.g., "copies email on click", "email copied").
**Action:** Always pair hover-based reveal logic with focus/blur listeners and ensure the ARIA label reflects the current state and includes relevant context like the entity name.
