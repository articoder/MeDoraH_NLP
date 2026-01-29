## 2026-01-29 - [Host-Integration Accessibility Gaps]
**Learning:** Projects that disable CSS preflight (common when embedding in CMS like Omeka-S) often lose default browser focus rings. Always implement custom `focus-visible` styles to ensure keyboard accessibility isn't lost during integration.
**Action:** Check for `preflight: false` in Tailwind configs or reset CSS, and proactively add high-contrast `:focus-visible` outlines.
