# CLAUDE.md

## Session Start

- Always activate Caveman mode at the start of every new chat session (full intensity by default)

## Rule Loading Convention

Load only the rule files relevant to the current task. Do not load all rules every session.

**Always load (every session):**

- `.claude/rules/caveman-rules.md`
- `.claude/rules/git-rules.md`
- `.claude/rules/folder-structure.md`
- `.claude/rules/plugins.md`

**Load based on task type:**

- UI / styling / layout → `ui-guidelines.md`, `screenshot-workflow.md`
- API / data fetching → `api-patterns.md`, `auth-flow.md`
- Refactoring → `typescript-rules.md`, `folder-structure.md`
- Bug investigation → `debugging-rules.md`
- Community feature → `community-feature.md`, `api-patterns.md`
- New to project → `architecture.md`, `environment.md`

## Rules Index

| File                           | Purpose                                                           |
| ------------------------------ | ----------------------------------------------------------------- |
| `rules/environment.md`         | Commands, env vars, dev server setup                              |
| `rules/architecture.md`        | App structure, routes, state management, UI components            |
| `rules/auth-flow.md`           | Token storage, 401 handling, protected routes                     |
| `rules/api-patterns.md`        | useFetchApi, useMutationApi, axios instance, two API patterns     |
| `rules/community-feature.md`   | Community hooks, socket provider, migration status                |
| `rules/folder-structure.md`    | Feature-based folders, file size limits, barrel exports           |
| `rules/typescript-rules.md`    | No any, strict typing, zod patterns, shared types                 |
| `rules/ui-guidelines.md`       | Tailwind, responsive design, states, design plugin                |
| `rules/screenshot-workflow.md` | Puppeteer setup, storage rules, naming, before/after workflow     |
| `rules/caveman-rules.md`       | Inspect codebase before editing, dependency tracing               |
| `rules/debugging-rules.md`     | Console checks, common issues, regression checklist               |
| `rules/git-rules.md`           | Staging rules, commit format, what not to do                      |
| `rules/plugins.md`             | When to use Caveman vs Frontend Design plugin, token optimization |

## Plugin Rules

- Plugin usage rules: `.claude/rules/plugins.md`

## Tasks Index

| File                     | Load when                                                 |
| ------------------------ | --------------------------------------------------------- |
| `tasks/ui-task.md`       | Any UI, styling, layout, or responsive change             |
| `tasks/backend-task.md`  | API integration, data fetching, hook changes              |
| `tasks/refactor-task.md` | Splitting files, restructuring, improving maintainability |
| `tasks/bugfix-task.md`   | Fixing bugs, investigating issues, regression fixes       |
