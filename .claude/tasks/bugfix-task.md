# Bugfix Task Workflow

## Steps

1. Load rules: `debugging-rules.md`, `api-patterns.md`, `auth-flow.md` (load relevant rules for bug domain)
2. Reproduce the issue — confirm behavior before touching code
3. Run Caveman — trace root cause through components, hooks, and API layer
4. Identify exact file and line causing the issue
5. Implement minimal fix — do not refactor surrounding code
6. Verify fix resolves original issue
7. Check for regressions in related flows
8. Inspect browser console — no new errors
9. Run `npm run lint`
