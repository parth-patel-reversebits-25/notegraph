# Git Rules

## Staging

- Stage only modified code files relevant to the task
- Never stage plan files (`.claude/plans/`, `CLAUDE.md` changes unrelated to task)
- Never stage `.env`, credentials, or secrets
- Prefer `git add <specific-file>` over `git add -A` or `git add .`

## Commit Messages

- Use conventional commits format: `type: short description`
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `test`
- Subject line under 72 characters
- Body only when "why" is non-obvious

## What NOT to Do

- Do not commit unrelated file changes
- Do not amend published commits
- Do not force push without explicit user instruction
- Do not skip pre-commit hooks (`--no-verify`)
