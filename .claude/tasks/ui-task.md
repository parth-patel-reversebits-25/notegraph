# UI Task Workflow

## Steps

1. Load rules: `ui-guidelines.md`, `screenshot-workflow.md`, `debugging-rules.md`, `caveman-rules.md`
2. Run Caveman — locate all relevant components, layouts, breakpoints, shared wrappers
3. Start dev server (`npm run dev`)
4. Capture **before** screenshot in `./temporary-screenshot/`
5. Implement UI change
6. Capture **after** screenshot
7. Compare before/after for regressions, spacing, alignment
8. Check mobile, tablet, desktop breakpoints
9. Inspect browser console — no errors, no warnings
10. Run `npm run lint`
