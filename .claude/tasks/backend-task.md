# Backend Task Workflow

## Steps

1. Load rules: `api-patterns.md`, `auth-flow.md`, `typescript-rules.md`, `debugging-rules.md`
2. Run Caveman — trace API hook, endpoint, and response type chain
3. Inspect request payload and expected response shape
4. Verify TypeScript types match actual API response
5. Check React Query cache behavior (`staleTime`, invalidation, refetch triggers)
6. Implement change
7. Test API call in browser — verify network tab response
8. Check console for errors or warnings
9. Run `npm run lint`
