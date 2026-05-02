# Auth Flow

## Provider

`AuthProvider` lives at `src/auth/context/auth-provider.tsx` and manages all authentication state.

## Token Storage

- JWT stored in `localStorage` under key `"token"` (`constants.ACCESS_TOKEN`)
- Practitioner preview mode flag stored in `sessionStorage` under `"is_practitioner"`

## Unauthorized Handling

- On 401, axios interceptor fires global `"unauthorized"` DOM event
- `AuthProvider` listens for this event and calls `logout()`

## Protected Routes

- `PUBLIC_ROUTES` defined in `auth-provider.tsx`
- All other routes require token and redirect to `/{slug}/login`
