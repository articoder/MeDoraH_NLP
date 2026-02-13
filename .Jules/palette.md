# Palette's Journal

## 2025-05-14 - Accessible Reveal-and-Copy Pattern
**Learning:** Interactive "reveal" patterns (e.g., showing emails on hover) are often inaccessible to keyboard and screen reader users. Adding focus/blur listeners, dynamic aria-labels, and an aria-live announcer provides a complete and delightful experience for all users.
**Action:** Always implement focus listeners alongside hover listeners for reveal patterns, and use an aria-live region to announce state changes (like "Copied") that aren't otherwise communicated to screen readers.
