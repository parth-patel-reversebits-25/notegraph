# Caveman Rules

## Always Use Caveman First

- Before any code change, activate Caveman mode
- Use Caveman to locate related files, components, hooks, styles, utilities, and shared wrappers
- Use Caveman to understand dependency chains and where components are used
- Before editing UI, identify all relevant breakpoints, modal wrappers, shared layout components, and Tailwind patterns
- Even for small UI fixes, inspect surrounding codebase context first

## Caveman Workflow

1. Identify all files involved in the change
2. Trace dependencies (what imports this, what does this import)
3. Find shared wrappers, custom-ui components, existing patterns
4. Only then begin implementation
