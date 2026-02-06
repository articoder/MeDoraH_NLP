## 2025-05-14 - [Accessible Reveal Patterns]
**Learning:** Interactive reveal patterns (like showing an email on hover) are often inaccessible to keyboard and screen reader users. To fix this, use :focus-visible for visual reveal and dynamic aria-label updates combined with aria-live regions for screen reader feedback.
**Action:** Always ensure hover-based reveal effects are mirrored with focus-based listeners and provide explicit screen reader announcements for the revealed content.
