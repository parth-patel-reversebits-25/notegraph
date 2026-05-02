# TypeScript Rules

## Strictness

- Never use `any` — use `unknown` and narrow, or define a proper type
- Enable strict mode; do not bypass type errors with `@ts-ignore` unless absolutely unavoidable (comment reason)
- Avoid type assertions (`as SomeType`) without validation

## Interfaces and Types

- Extract shared interfaces into dedicated `types/` files, never inline in component files
- Use `interface` for object shapes, `type` for unions/intersections/aliases
- Export types from barrel `index.ts` in `types/` folders

## Zod Patterns

- Define validation schema with zod, derive TypeScript type via `z.infer<typeof schema>`
- Never duplicate schema definition and type definition — one source of truth

```ts
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;
```

## Reusability

- Identify types used in 2+ places — extract immediately
- API response types live in `types/` alongside feature hooks
- Form types derive from zod schemas, not hand-written separately
