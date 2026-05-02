# Debugging Rules

## Always Check Browser Console

After any change, inspect for:

- Runtime errors
- Hydration issues
- Failed API calls
- Missing assets
- React warnings

## Common Issue Checklist

- **Hydration errors** — check server vs client rendering mismatch
- **401 errors** — check token in `localStorage`, verify `AuthProvider` state
- **Failed API calls** — check `NEXT_PUBLIC_BACKEND_BASE_URL`, request payload, response shape
- **Missing data** — check React Query cache, `staleTime`, and invalidation logic
- **Layout shifts** — check responsive breakpoints, conditional rendering

## Regression Checks After Change

- Verify feature still works end-to-end
- Check related flows that share components or hooks
- Run `npm run lint` to catch obvious issues
- Check for TypeScript errors before closing task
