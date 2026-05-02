# API Patterns

## Pattern 1 — React Query Hooks (most of app)

Three custom hooks wrap TanStack Query + axios:

| Hook | File | Use case |
|---|---|---|
| `useFetchApi` | `src/hooks/useFetchApi.ts` | Standard GET; `staleTime: 300000` (5 min) |
| `useFetchApiWithPagination` | `src/hooks/useFetchApiWithPagination.ts` | Infinite scroll GET; page/limit auto-added |
| `useMutationApi` | `src/hooks/useMutationApi.ts` | POST/PATCH/DELETE; supports `dynamicEndpointSuffix` |

All three:
- Read token from `localStorage`
- Attach as `Authorization: Bearer <token>`
- Use shared axios instance at `src/utils/axiosInstance.ts`
- Base URL from `NEXT_PUBLIC_BACKEND_BASE_URL`

## Pattern 2 — Plain Async Functions (community feature)

- `src/app/api/communities/index.ts` exports typed async functions (e.g. `getChannelPosts`, `createPost`)
- Call `customFetchData` from `@/api/utils/customFetchData`
- Consumed inside TanStack Query hooks in `src/components/communities/hooks/`
- Used for community feature migrated from nutritionist portal

> **Note:** `@/api/utils/customFetchData` does not yet exist — needs to be created as part of finishing the community migration.
