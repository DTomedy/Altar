# Skills/api-route-scaffolder/SKILL.md — Altar

> Read before creating any Next.js API route.

---

## Route Location Convention

All API routes live under `app/api/`. Follow this folder structure:

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   └── refresh/route.ts
├── campaigns/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       └── route.ts          # GET, PATCH, DELETE
├── contributions/
│   ├── route.ts              # POST (initiate)
│   └── verify/route.ts       # POST (verify after payment)
├── wallet/
│   ├── route.ts              # GET (balance + transactions)
│   └── withdraw/route.ts     # POST (initiate withdrawal)
├── kyc/
│   └── route.ts              # POST (upload document)
└── webhooks/
    └── flutterwave/route.ts  # POST (webhook handler)
```

---

## Standard Route Template

Every API route follows this exact structure. No exceptions.

```ts
// app/api/[resource]/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

// ── Input schema ─────────────────────────────────────────────────────────────
const Schema = z.object({
  // Define all expected fields with constraints
  // Note: server-set fields (id, status, createdAt, updatedAt, ownerId) are never in the schema
  title: z.string().min(3).max(100).trim(),
})

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check (remove for public routes; use verifyAuthWithFallback if cookie fallback is needed)
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
    // Use prisma.$transaction for operations that update multiple records (e.g., contribution success + wallet credit)
    const result = await prisma.campaign.create({
      data: { ...parsed.data, ownerId: user.userId }
    })

    // 4. Return response
    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('[POST /api/resource]', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 })
  }
}
```

---

## HTTP Method Conventions

| Method | Use for | Success status |
|---|---|---|
| `GET` | Fetching data | `200` |
| `POST` | Creating a resource | `201` |
| `PATCH` | Partial update | `200` |
| `DELETE` | Deleting a resource | `200` (with `{ deleted: true }`) |

---

## Response Shape Conventions

**Single resource:** return the resource object directly (never wrap in `{ success: true, data: ... }`).

```json
{ "id": "...", "title": "...", "status": "ACTIVE" }
```

**List:** use the standard paginated envelope.

```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 24, "totalPages": 2 }
}
```

**Error:** use the standard error envelope (see `rules/architecture.md` for full reference).

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": { "title": ["Required"] } } }
```

---

## Auth Levels

| Route type | Auth requirement |
|---|---|
| Public campaign page data | No auth — `verifyAuth` not called |
| Contribution initiation | No auth — contributor has no account |
| Webhook endpoint | Flutterwave signature verification only |
| All dashboard/wallet/KYC routes | `verifyAuth` required — return `401` if missing |

---

## Zod Schema Patterns for Altar

```ts
// Campaign creation
// Server-set fields (id, status, createdAt, updatedAt, ownerId, slug) are never accepted from the client
const CreateCampaignSchema = z.object({
  title:         z.string().min(3).max(100).trim(),
  description:   z.string().min(10).max(1000).trim(),
  type:          z.enum(['WISHLIST', 'GOAL']),
  goalAmount:    z.number().positive().min(500).max(50_000_000).optional(),
  deadline:      z.string().datetime().optional(),
  allowOverflow: z.boolean().default(false),
})

// Contribution initiation
// id, status, flwTxRef, flwTxId, createdAt are set server-side
const ContributionSchema = z.object({
  campaignId:     z.string().cuid(),
  wishlistItemId: z.string().cuid().optional(),
  amount:         z.number().min(500).max(10_000_000),
  isAnonymous:    z.boolean().default(false),
  displayName:    z.string().max(60).trim().optional(),
  message:        z.string().max(300).trim().optional(),
  txRef:          z.string().min(1),
})

// Withdrawal
const WithdrawalSchema = z.object({
  amount:        z.number().positive(),
  accountNumber: z.string().length(10),
  bankCode:      z.string().min(3),
})

// KYC upload
const KycSchema = z.object({
  level:       z.number().int().min(1).max(3),
  documentUrl: z.string().url(),
  documentType: z.enum(['NIN', 'BVN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD']),
})
```

---

## Campaign Slug Generation

Campaign slugs must be URL-safe and human-readable.

```ts
// lib/slugs.ts
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6)

export function generateCampaignSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
  return `${base}-${nanoid()}`
}
// Result: "ada-birthday-2026-k3m9xz"
```

---

## Error Logging Convention

Always include the HTTP method and route path in the error log:

```ts
console.error('[POST /api/campaigns]', error)
console.error('[GET /api/wallet]', error)
console.error('[POST /api/contributions/verify]', error)
```

This makes searching logs straightforward.

---

## GET Route Conventions

```ts
// app/api/[resource]/route.ts — GET handler
export async function GET(req: NextRequest) {
  try {
    // 1. Auth (if protected)
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
    const skip = (page - 1) * limit

    // 3. Query with pagination
    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        where: { ownerId: user.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.count({ where: { ownerId: user.userId } }),
    ])

    // 4. Return paginated response
    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[GET /api/resource]', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 })
  }
}
```

- All GET list endpoints support `?page=1&limit=20` query parameters
- Default limit is 20, maximum is 100
- Always return `{ data, pagination }` — never return a raw array

## Rate Limiting

All mutation endpoints should apply rate limiting (see `rules/security.md` for limits by endpoint):

```ts
// Near the top of the route handler, after the try block
// const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
// Check rate limit before proceeding with business logic
// Return 429 with { error: { code: 'RATE_LIMITED', message: 'Too many requests' } } if exceeded
```