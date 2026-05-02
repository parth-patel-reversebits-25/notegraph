# Screenshot Workflow

## Puppeteer Setup

- Installed at: `C:/Users/parth/projects/puppeteer-test/`
- Chrome cache: `C:/Users/parth/.cache/puppeteer/`
- Script: `C:/Users/parth/projects/puppeteer-test/screenshot-local.mjs`

## Take Screenshots

```bash
cd C:/Users/parth/projects/puppeteer-test && node screenshot-local.mjs http://localhost:3000 screenshot.png
```

## Storage Rules

- Always create `./temporary-screenshot` folder in project root before any screenshot
- Create automatically if it does not exist
- Store all workflow, UI review, before/after, and regression screenshots inside this folder
- Never store in project root or random directories

## Naming Convention

Auto-increment filenames:
- `screenshot-1.png`
- `screenshot-2.png`
- `screenshot-3-label.png`

Before new screenshot, check existing files and continue from highest number.

## Workflow for UI Tasks

1. Start dev server
2. Capture **before** screenshot
3. Implement change
4. Capture **after** screenshot
5. Compare for regressions, spacing, alignment, and responsive behavior
6. Re-check mobile, tablet, desktop breakpoints for significant changes

## Verification Checklist

- Spacing and padding consistency
- Typography size, weight, and line-height
- Alignment and layout consistency
- Border radius and shadows
- Button states, hover states, and disabled states
- Overflow, clipping, and wrapping issues
- Mobile responsiveness and breakpoint behavior
- Empty, loading, and error states when applicable
