# Plugin Rules

## Purpose

- Load plugins only when relevant to current task
- Prefer minimal plugin usage — avoid loading both plugins for small changes
- Do not invoke plugins automatically for every task
- Unneeded plugins waste tokens and context

---

## Caveman Plugin

Load Caveman **before making any code change**.

**Use Caveman for:**
- Finding related files, hooks, utils, contexts, shared wrappers
- Tracing import/export dependency chains
- Understanding component hierarchy and reuse
- Inspecting breakpoints, layouts, responsive wrappers before UI edits
- Understanding API flow before backend changes
- Locating related types, constants, and validation schemas

**Do not skip Caveman for:**
- UI fixes
- Refactors
- Shared component changes
- State management changes
- API changes
- Large bug fixes

**May skip Caveman for:**
- Commit message generation
- Simple text or markdown edits
- README updates
- Very isolated one-line fixes

---

## Frontend Design Plugin

Load only for visual or layout-related tasks.

**Use for:**
- Tailwind spacing, alignment, border radius, shadow fixes
- Layout improvements and UI redesigns
- Responsive issues — mobile, tablet, desktop breakpoints
- Modal, drawer, tooltip, dropdown, and table layout fixes
- Matching screenshot or reference design
- Empty, loading, and error state UI improvements
- Typography consistency
- Overflow, clipping, wrapping issues
- Form layout improvements
- Grid, flex, and responsive restructuring
- Dashboard card redesigns

**Do not use for:**
- API changes or backend fixes
- Auth flow
- React Query invalidation or cache logic
- State management only
- TypeScript-only issues
- Folder restructuring
- CLAUDE.md or documentation changes
- Git or commit work
- Server-side logic, database changes, validation-only fixes

---

## Screenshot Workflow Dependency

When using the frontend design plugin, also load:
- `.claude/rules/screenshot-workflow.md`
- `.claude/rules/ui-guidelines.md`
- `.claude/tasks/ui-task.md`

Visual tasks must always include:
- Before screenshot
- After screenshot
- Responsive verification (mobile / tablet / desktop)
- Console check
- Regression review

---

## Plugin Loading by Task Type

| Task Type | Plugin Usage |
|---|---|
| UI fix | Caveman + Frontend Design Plugin |
| Responsive issue | Caveman + Frontend Design Plugin |
| Layout redesign | Caveman + Frontend Design Plugin |
| Backend bug | Caveman only |
| API change | Caveman only |
| Refactor | Caveman only |
| TypeScript error | Caveman only |
| Commit message | No plugin |
| Markdown / docs update | No plugin |
| CLAUDE.md restructuring | No plugin |

---

## Token Optimization

- Never load plugins unless relevant
- Do not load frontend design plugin for backend work
- Do not load screenshot workflow for non-visual tasks
- Prefer minimum plugins needed
- For simple isolated fixes, prefer no plugin at all
