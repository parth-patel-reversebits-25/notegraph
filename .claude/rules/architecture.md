# Architecture

## Stack

**Next.js 15 App Router** with `@/*` aliased to `./src/*`.

## Route Structure

All routes live under `src/app/`:

- `(auth)/[slug]/...` — unauthenticated pages (login, signup, forgot-password, etc.)
- `(authenticated)/[slug]/...` — authenticated pages behind `AuthProvider`
- `export/...` — public PDF export pages (meal plan, shopping list, recipe bundle)
- `api/communities/index.ts` — server-side API function module for the community feature
- `api/image-status/route.ts` — Next.js route handler

The `[slug]` segment is the practitioner's **brand slug**, used throughout to scope all data and routing to a specific practitioner.

## State Management

- **TanStack Query** (`@tanstack/react-query`) for server state; `QueryClient` initialized once in `src/context/provider.tsx`
- **React Context** for global UI state:
  - `AuthProvider` — user, token, brand preference
  - `DrawerContextProvider` — mobile sidebar open/close state
  - `DiaryProvider` — food diary state
  - Community feature has own `CommunitySocketProvider` and `communityContext` for WebSocket + community UI state

## UI Components

- `src/components/ui/` — Radix UI primitives wrapped with Tailwind (shadcn/ui pattern)
- `src/components/common/custom-ui/` — project-specific wrappers (CustomButton, CustomSelect, etc.)
- Forms use `react-hook-form` + `zod` for validation
- Toast notifications: `react-hot-toast` (used in `useFetchApi`) and `react-toastify` (used in `useMutationApi`) — both present
