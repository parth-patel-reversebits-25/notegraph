# Folder Structure Guidelines

## Feature-Based Organization

- Always create clear feature-based folder structure for large modules
- Never keep everything in single file
- Prefer feature-level folder organization over file-type organization for complex features

## Separation of Concerns

Split logic by responsibility:

- `components/` — reusable UI blocks
- `layouts/` — screen-specific or responsive layouts
- `hooks/` — state management and business logic
- `utils/` — helper functions and formatting logic
- `types/` — TypeScript interfaces and shared types
- `constants/` — static values, labels, and configuration

## File Size Rules

- Prefer files under 150 lines
- Avoid files larger than 300 lines unless absolutely necessary
- If file becoming too large, proactively split before adding more code

## Extraction Rules

- Shared interfaces → dedicated type files
- Shared helper functions → utility files
- Responsive layouts with meaningful structural differences → dedicated layout files
- Use barrel exports (`index.ts`) inside feature folders when it improves import readability

## What NOT to Mix in One File

- API logic + UI rendering + helper methods + state management
- Never combine these concerns in a single file

## Before Creating a Feature

- Think about long-term maintainability, scaling, and reuse
- Plan the folder structure before writing code
