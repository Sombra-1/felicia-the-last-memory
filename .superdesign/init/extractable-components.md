# Extractable components

This is a canvas-first WebGL experience. There are no multi-page nav, sidebar, card,
or form systems worth converting into Superdesign DraftComponents.

## ExperienceShell

- Source: `src/ui/ExperienceShell.tsx`
- Category: layout
- Description: Full-viewport scene shell with minimal archive chrome.
- Extractable props: `phase`, `audioEnabled`, `quality`
- Hardcoded: FELICIA wordmark, intro copy, sound meter, footer integrity line.

## TrialPrompt

- Source: `src/ui/MemoryInterface.tsx`
- Category: basic
- Description: State-aware trial metadata, compact prompt, and three-beat progress.
- Extractable props: `fragment`, `beat`, `score`, `transitioning`, `returning`
- Hardcoded: memory names, input labels, reveal text, accent mapping.

Component extraction is intentionally skipped: neither item is reused across pages,
and the 3D scene cannot be represented faithfully as a Petite-Vue DOM component.
