## 2025-05-14 - Accessible Reveal Patterns
**Learning:** The "reveal on hover" pattern for contact details (common in academic sites) is inaccessible to keyboard and screen reader users. Simply adding focus event listeners is not enough if the screen reader doesn't know the text has changed.
**Action:** Always pair focus-based reveals with aria-live="polite" and descriptive aria-labels to ensure keyboard parity and screen reader awareness.
