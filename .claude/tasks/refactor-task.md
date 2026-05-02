# Refactor Task Workflow

## Steps

1. Load rules: `folder-structure.md`, `typescript-rules.md`, `debugging-rules.md`
2. Run Caveman — map all files to be split, their imports, and dependents
3. Plan folder structure before touching files
4. Split large files — preserve all behavior, change nothing functional
5. Update all import paths
6. Verify no TypeScript errors (`npm run build` or check editor diagnostics)
7. Run `npm run lint`
8. Smoke test affected features in browser
