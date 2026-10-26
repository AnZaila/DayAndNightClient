# Design: 朝暮

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: editorial
- Shape of the first page: app screen
- Theme: brand (vibe: "a paper diary with one indigo")
- Axes: cool paper/serif/indigo · posture: restrained

## Tokens
`src/assets/styles/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: oklch(97.2% 0.008 277);  --color-paper-2: oklch(99% 0.006 277);  --color-paper-3: oklch(95% 0.014 277);
  --color-ink: oklch(27% 0.04 277);  --color-ink-2: oklch(36% 0.035 277);  --color-muted: oklch(46% 0.03 277);  --color-rule: oklch(86% 0.016 277);
  --color-accent: #6366f1;  --color-accent-ink: #fffffe;  --color-focus: #6366f1;
  --font-display: "Iowan Old Style", "Palatino Linotype", "Songti SC", serif;  --font-body: "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif;
  --radius-card: 8px;  --radius-pill: 999px;  --rule-hair: 1px;  --shadow-card: none;
}
```
The spacing scale, the type scale, the easings and the durations are the scaffold's and live in `tokens.css`. Reading pages use `--container: 1120px`. The write screen uses `--measure-write: 1640px` so the editor and the preview can sit side by side. Both modes use `[data-theme]`.

## Controls
- Primary: solid indigo fill · 8px radius · 36px height
- Secondary: hairline or quiet text · same radius and height

## Motion
- Character: still; state changes only; under reduced motion everything ends at once.

## Exports
`src/assets/styles/tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request, per `export-formats.md`.
