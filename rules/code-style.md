# rules/code-style.md — Altar

> Read before writing any TypeScript, React, or API code.

---

## Language

- TypeScript only. Strict mode is enabled. `any` is forbidden — use `unknown` and narrow, or define a proper type.
- All files use `.ts` or `.tsx`. No `.js` files.
- Use single quotes for all strings. Use double quotes only for JSX attributes and JSON.
- ESLint (Next.js config) and Prettier are configured at the project root. Run `npm run lint` and `npx prettier --check .` before committing.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `CampaignCard.tsx` |
| Hooks | camelCase with `use` prefix | `useCampaign.ts` |
| API route files | lowercase, folder-per-route | `route.ts` inside `app/api/campaigns/[id]/` |
| Utility functions | camelCase | `formatNaira.ts` |
| Types & interfaces | PascalCase | `CampaignWithItems` |
| Prisma enums | SCREAMING_SNAKE | `CampaignStatus.ACTIVE` |
| Environment variables | SCREAMING_SNAKE | `FLUTTERWAVE_SECRET_KEY` |
| Database fields | camelCase in Prisma schema | `ownerId`, `createdAt` |

---

## Styling Rules

This project uses **Tailwind CSS** for layout, spacing, sizing, and structure. Brand colours and fonts come from the `/tokens` design system, registered in `tailwind.config.ts` as custom Tailwind classes.

```tsx
// ✅ Correct — Tailwind with brand token classes
<h1 className="font-display font-medium text-2xl text-primary">Ada's Birthday</h1>
<span className="font-mono font-medium text-xl text-primary">₦120,000.00</span>
<button className="bg-primary text-white rounded-full px-6 py-2.5 font-body font-medium">
  Give a gift
</button>

// ❌ Wrong — never hardcode
<h1 style={{ fontFamily: 'Plus Jakarta Sans', color: '#3D1F6B' }}>Ada's Birthday</h1>
```

Full class reference is in `rules/design-system.md`. Read it before building any component.

---

## TypeScript Rules

```ts
// ✅ Always type function parameters and return values
async function getCampaign(slug: string): Promise<Campaign | null> {}

// ✅ Use type inference where obvious
const campaigns = await prisma.campaign.findMany() // typed automatically

// ❌ Never use any
function handle(data: any) {} // forbidden

// ✅ Use unknown + narrowing for external data
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null && 'id' in data) {}
}

// ✅ Use Zod for all API input validation
import { z } from 'zod'
const CreateCampaignSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(['WISHLIST', 'GOAL']),
  goalAmount: z.number().positive().optional(),
})
```

### Interfaces vs Types

- Prefer `interface` for object shapes that can be extended (props, API responses, Prisma-derived types)
- Use `type` for unions, intersections, tuples, and primitive aliases
- Always export shared types/interfaces from `types/` — never define them inline in component files

```ts
// ✅ interface for objects
export interface CampaignCardProps {
  campaign: Campaign
  onContribute?: () => void
}

// ✅ type for unions and utilities
export type PaymentStatus = 'pending' | 'success' | 'failed'
export type Nullable<T> = T | null
```

### Null vs Undefined

- Use `null` for intentional absence (optional DB fields, cleared form input)
- Use `undefined` only for genuinely uninitialized state (before a fetch resolves)
- Optional function parameters use `?` syntax, not `| undefined`

### Async Fetch Patterns

- Fetch data in Server Components with `async` — never in Client Components
- Use `Promise.all` for independent parallel requests; sequential `await` only when one depends on another

```ts
// ✅ Parallel — independent requests
const [campaign, owner] = await Promise.all([
  prisma.campaign.findUnique({ where: { slug } }),
  prisma.user.findUnique({ where: { id: ownerId } }),
])

// ✅ Sequential — one depends on the other
const campaign = await prisma.campaign.findUnique({ where: { slug } })
const contributions = await prisma.contribution.findMany({ where: { campaignId: campaign.id } })
```

---

## React & Component Rules

```tsx
// ✅ Functional components only — no class components
export function CampaignCard({ campaign }: { campaign: Campaign }) {}

// ✅ Named exports for all components
export function Button() {}           // correct
export default function Button() {}   // avoid default exports for components

// ✅ Props interface defined above the component
interface CampaignCardProps {
  campaign: Campaign
  onContribute?: () => void
}
export function CampaignCard({ campaign, onContribute }: CampaignCardProps) {}

// ✅ Server Components by default — add 'use client' only when needed
// Needs 'use client': useState, useEffect, event handlers, browser APIs, Flutterwave modal

// ✅ Async Server Components for data fetching
// Fetch data directly in the component — no useEffect, no SWR, no React Query
async function CampaignPage({ params }: { params: { slug: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { slug: params.slug } })
  return <CampaignCard campaign={campaign} />
}

// ✅ Client/Server boundary
// Never import into client components: prisma, server-only modules, process.env (except NEXT_PUBLIC_)
// Add `import 'server-only'` at the top of any server-only module to enforce the boundary

// ✅ All styling via Tailwind — no inline style objects except for dynamic values (e.g. progress bar width)

// ✅ Use cn() for conditional class names — never template literal strings
import { cn } from '@/lib/utils'

export function Button({ variant = 'primary', className }: ButtonProps) {
  return (
    <button className={cn('rounded-full font-body font-medium', variant === 'primary' && 'bg-primary text-white', className)}>
      Give a gift
    </button>
  )
}
```

---

## API Route Rules

All API routes live in `app/api/` and follow this exact pattern:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

const Schema = z.object({ ... })

export async function POST(req: NextRequest) {
  try {
    // 1. Verify auth (remove for public routes)
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
    }

    // 2. Parse and validate body
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }, { status: 422 })
    }

    // 3. Business logic
    const result = await prisma.campaign.create({ data: { ...parsed.data, ownerId: user.id } })

    // 4. Return response
    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('[POST /api/campaigns]', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 })
  }
}
```

- Every route wraps in `try/catch`
- Every route validates input with Zod before touching the database
- Every protected route calls `verifyAuth` first
- Log errors with route context: `[METHOD /api/path]`
- Return consistent `{ error: { code, message, details? } }` shape (see `rules/architecture.md` for full error code reference)
- Return consistent success shape: resource directly, or `{ data, pagination }` for lists

---

## Currency Formatting

Never format naira amounts manually. Always use the shared utility.

```ts
// lib/formatters.ts
export function formatNaira(amount: number | Decimal): string {
  return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

// In components — always font-mono for amounts
<span className="font-mono font-medium text-xl text-primary">
  {formatNaira(campaign.goalAmount)}
</span>
```

---

## Imports

```ts
// ✅ Path aliases always — no dot-dot relative imports
import { prisma } from '@/lib/prisma'        // correct
import { prisma } from '../../../lib/prisma'  // forbidden

// Import order
// 1. React / Next
// 2. Third-party libraries
// 3. Internal @/ imports
// 4. Relative (same folder only)
// 5. Type imports last

// ✅ Server-only boundary — add to any module that uses server APIs
import 'server-only'

// ✅ Never import server-only modules into client components
// ❌ import { prisma } from '@/lib/prisma' inside a 'use client' component
```

---

## File Organization

- **One component per file** — never co-locate multiple components in a single file
- **Max 250 lines per file** — split into smaller modules if exceeded
- **Barrel files (`index.ts`)** are allowed for public API surfaces only:

```ts
// components/ui/index.ts
export { Button } from './Button'
export { Input } from './Input'
export { Card } from './Card'
```

- **Utilities** go in `lib/` by domain (`lib/flutterwave.ts`, `lib/email.ts`)
- **Types** go in `types/` — one file per domain (`types/campaign.d.ts`, `types/auth.d.ts`)
- **Hooks** go in `hooks/` — one file per hook (`hooks/useCampaign.ts`)

---

## Error Handling

- Never swallow errors silently — always log with context using `console.error`
- User-facing messages never expose stack traces or internal details
- Use consistent error codes matching `rules/architecture.md`:

| HTTP | Code | When |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Valid JWT but insufficient KYC level |
| 404 | `NOT_FOUND` | Resource does not exist |
| 422 | `VALIDATION_ERROR` | Input failed Zod validation |
| 409 | `CONFLICT` | Duplicate or conflicting state |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error — generic message only |

```ts
// ✅ Return shape for all errors
NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } }, { status: 422 })
```

---

## Testing

- **Framework:** Vitest (preferred) or Jest
- **File naming:** `*.test.ts` or `*.test.tsx` — co-located next to the file under test
- **Test location:** Tests live next to their source files, not in a separate `__tests__/` directory

```
components/campaign/CampaignCard.tsx
components/campaign/CampaignCard.test.tsx       ✅ co-located
lib/formatNaira.ts
lib/formatNaira.test.ts                          ✅ co-located
```

- **API route tests:** Use `vi.mock()` to mock Prisma and `NextRequest`. Test the handler function directly.
- **Component tests:** Use `@testing-library/react`. Avoid testing implementation details — test behavior.
- **Coverage threshold:** Branches ≥ 80%. Run `npm run test -- --coverage` before submitting PRs.

---

## Comments

```ts
// ✅ Comment why, not what
// Fee is deducted at withdrawal, not contribution — wallet holds gross amount
export function calculatePlatformFee(amount: Decimal): Decimal {
  return amount.mul(0.03)
}

// ❌ No commented-out code in commits
// ❌ No obvious comments: "// loop through items"

// ✅ TODO and FIXME are allowed with owner context
// TODO(@ada): add pagination when contribution count exceeds 20
// FIXME: withdrawal fails when wallet balance is exactly 0.00
```