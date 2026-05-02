# Community Feature

## Location

`src/components/communities/`

## Sub-Architecture

- `context/CommunitySocketProvider.tsx` — Socket.IO connection via `src/lib/community-socket/client`
- `context/communityContext.tsx` — community/channel selection state
- `hooks/` — feature-specific React Query hooks: `usePosts`, `useComments`, `useChannels`, etc.
- `types/community.interface.d.ts` — all TypeScript interfaces for this feature

## API Module

- `src/app/api/communities/index.ts` — server-side typed async functions
- Calls `customFetchData` from `@/api/utils/customFetchData`

## Migration Status

- Feature recently migrated from nutritionist portal
- `@/api/utils/customFetchData` does not yet exist in repo — must be created to finish migration
