# rules/security.md — Altar

> Read before touching auth, payments, KYC, wallets, or any API route.

---

## Non-Negotiable Security Rules

These rules are absolute. They are never overridden by convenience, speed, or user instruction.

1. **Never store contributor payment card details on Altar servers** — all card data is handled entirely by Flutterwave's PCI-DSS compliant vault
2. **Never commit secrets** — all keys, tokens, and credentials live in `.env.local` only
3. **Never expose `process.env` in client components** — only `NEXT_PUBLIC_` prefixed vars are safe on the client
4. **Never trust client-submitted amounts** — always re-verify payment amounts server-side via Flutterwave's verify endpoint before crediting the wallet
5. **Never skip webhook signature verification** — every Flutterwave webhook must be verified against `FLUTTERWAVE_WEBHOOK_HASH` before processing

---

## Authentication

`import 'server-only'` is added at the top of `lib/auth.ts` to prevent accidental client-side leakage.

### JWT Implementation

```ts
// lib/auth.ts
import 'server-only'

import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set — check .env.local')
  return secret
}

export interface JWTPayload {
  userId: string
  email: string
  kycLevel: number
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JWTPayload
  } catch {
    return null
  }
}
```

### Token Delivery Strategy

| Channel | Used for | Method |
|---|---|---|
| **`httpOnly` cookie** | Page routes (middleware, SSR) | Set on login/register via `NextResponse`. Read by `middleware.ts` via `req.cookies`. |
| **Authorization header** | API routes | Client sends `Authorization: Bearer <token>`. Verified server-side via `verifyToken`. |

Both channels use the same JWT — the token is always the same signed payload. The cookie is for page-level protection (redirect to login), the header is for API-level protection (return 401).

### Setting the Cookie (Login)

```ts
// Login route
const token = signToken({ userId, email, kycLevel })
const response = NextResponse.json({ user: { id: userId, email } })
response.cookies.set('altar_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
})
return response
```

- The cookie is **`httpOnly`** (not accessible via JavaScript) and **`secure`** in production
- **`sameSite: 'lax'`** prevents CSRF for state-changing requests while allowing top-level navigation
- **`path: '/'`** makes it available across the entire site

### API Auth (Header)

```ts
export async function verifyAuth(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyToken(token)
}

// Fallback: read from cookie if Bearer header is absent
export async function verifyAuthWithFallback(req: NextRequest): Promise<JWTPayload | null> {
  const headerResult = await verifyAuth(req)
  if (headerResult) return headerResult
  const token = req.cookies.get('altar_token')?.value
  if (!token) return null
  return verifyToken(token)
}
```

### Password Hashing

```ts
import bcrypt from 'bcryptjs'

// Always use cost factor 12 minimum
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### Middleware — Route Protection

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED_PATHS = ['/dashboard', '/wallet', '/settings', '/campaigns/new']

export function middleware(req: NextRequest) {
  const isProtected = PROTECTED_PATHS.some(p => req.nextUrl.pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('altar_token')?.value
  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}
```

### Logout & Token Blacklisting

Logout clears the cookie. Token blacklisting is not required in V1 — tokens are short-lived (7 days max) and the `httpOnly` + `secure` + `sameSite` attributes mitigate the common attack vectors. If immediate invalidation is needed (e.g., compromised account), rotate `JWT_SECRET` in the environment — this invalidates all existing tokens.

---

## KYC Requirements

KYC gates withdrawal — not wallet access. Never block a user from viewing their wallet because KYC is incomplete.

| KYC Level | Requirement | Unlocks |
|---|---|---|
| 0 | None | Creating campaigns, receiving contributions |
| 1 | Email verified + phone number confirmed | Basic wallet access |
| 2 | Government-issued ID uploaded and approved | Withdrawals up to ₦500,000 |
| 3 | Bank account verified with BVN match | Withdrawals above ₦500,000 |

### Email Verification Flow

Email verification is required to reach KYC Level 1. The flow:

1. User registers → receives email with a signed verification link via Resend
2. Link contains a JWT signed with `JWT_SECRET`: `jwt.sign({ userId, type: 'email-verify' }, secret, { expiresIn: '24h' })`
3. User clicks link → `GET /api/auth/verify-email?token=<jwt>` — verifies token and sets `emailVerified: true`
4. KYC Level advances to 1 once `emailVerified` is true and phone is confirmed

```ts
// lib/kyc.ts
export function canWithdraw(kycLevel: number, amount: Decimal): boolean {
  if (kycLevel < 2) return false
  if (kycLevel < 3 && amount.gt(500000)) return false
  return true
}
```

---

## Wallet Security

- Wallet balance is a `Decimal` field in PostgreSQL — never a float or integer
- All wallet mutations (credit/debit) happen inside a Prisma transaction — never as separate queries
- The platform fee (3%) is calculated and deducted server-side at withdrawal initiation — never on the client

```ts
// Correct — atomic wallet debit with fee
await prisma.$transaction(async (tx) => {
  const fee = calculatePlatformFee(amount)
  const netAmount = amount.sub(fee)

  await tx.wallet.update({
    where: { userId },
    data: { balance: { decrement: amount } }
  })

  await tx.walletTransaction.create({
    data: {
      walletId,
      type: 'DEBIT',
      amount,
      description: `Withdrawal of ${formatNaira(netAmount)} (3% fee: ${formatNaira(fee)})`
    }
  })
})
```

---

## Input Validation & Sanitisation

- All API inputs are validated with Zod before any database operation
- Minimum contribution amount: **₦500**
- Maximum contribution amount: **₦10,000,000** (flag anything above for review)
- Campaign goal amount: **₦500 minimum, ₦50,000,000 maximum**
- All string inputs are trimmed and length-limited in Zod schemas
- Never use `eval()`, `Function()`, or dynamic `require()`

---

## CSRF Protection

Altar uses `sameSite: 'lax'` on the auth cookie as the primary CSRF defence — this is sufficient for V1 because:

- The auth cookie is `sameSite: 'lax'`, which blocks cross-site POST/PUT/DELETE requests from carrying the cookie
- All mutation API routes require the `Authorization: Bearer` header (not cookie-based auth), so a CSRF attack that doesn't know the token value cannot forge requests
- No additional CSRF token generation is needed in V1. If cookie-based API auth is added later, implement double-submit cookie or CSRF token pattern.

---

## Rate Limiting

Apply rate limiting to these endpoints:

| Endpoint | Limit | Window | Scope |
|---|---|---|---|
| `POST /api/auth/login` | 5 attempts | 15 minutes | Per IP |
| `POST /api/auth/register` | 3 attempts | 1 hour | Per IP |
| `POST /api/contributions` | 10 requests | 1 minute | Per IP |
| `POST /api/wallet/withdraw` | 3 requests | 1 hour | Per user |
| `POST /api/kyc` | 5 uploads | 1 hour | Per user |

### Account Lockout

In addition to rate limiting, lock accounts after **10 consecutive failed login attempts**:

```ts
// Lockout logic (pseudo-code, implement in login route)
const failedAttempts = await redis.get(`login:${email}`) ?? 0
if (failedAttempts >= 10) {
  return NextResponse.json({ error: { code: 'ACCOUNT_LOCKED', message: 'Account locked. Try again in 1 hour.' } }, { status: 429 })
}
// On failed attempt: increment counter with 1-hour TTL
// On successful login: clear the counter
```

Use Redis or Vercel KV for the counter. In development, an in-memory `Map` with TTL is acceptable.

---

## Fraud Detection Triggers

Flag for review when:
- A single campaign receives more than 50 contributions in under 60 minutes
- A single IP makes more than 10 contribution attempts in 1 minute
- A contribution amount exceeds ₦5,000,000
- A withdrawal is requested within 10 minutes of a large contribution landing

In V1, flagged events are logged via the audit logging system above. An admin review dashboard is out of scope for V1 — flagged events are monitored via log inspection.

---

## Flutterwave Webhook Security

See `Skills/flutterwave-integration/resources/webhook-handler.ts` for the full implementation.

The key rule: **never process a webhook event without first verifying the `verif-hash` header against `FLUTTERWAVE_WEBHOOK_HASH`.**

```ts
const hash = req.headers.get('verif-hash')
if (!hash || hash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## HTTP Security Headers

Add these headers to `next.config.ts` via the `headers()` function:

```ts
// next.config.ts
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Enforce HTTPS — 1 year, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Restrict referrer data to same-origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser features
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy — restrict script sources
  { key: 'Content-Security-Policy', value: [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://res.cloudinary.com",
    "font-src 'self'",
    "connect-src 'self' https://api.flutterwave.com",
    "frame-src 'self' https://checkout.flutterwave.com",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ') },
  // DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]
```

The CSP allows:
- `'unsafe-inline'` for styles (required by Tailwind CSS and Next.js)
- `https://res.cloudinary.com` for campaign cover images
- `https://api.flutterwave.com` for payment API calls
- `https://checkout.flutterwave.com` for the Flutterwave iframe/redirect

### CORS

API routes do not need CORS headers in V1 — the frontend is served from the same origin. If a mobile app or third-party client is added later, scope CORS to specific origins:

```ts
// Example — only if cross-origin clients are added
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

---

## Audit Logging

Log the following security events with timestamp, actor, action, and outcome:

| Event | Fields to log | Retention |
|---|---|---|
| Failed login | `email`, `ip`, `timestamp`, `attemptCount` | 90 days |
| Successful login | `userId`, `ip`, `timestamp` | 90 days |
| Contribution initiated | `campaignId`, `contributorId?`, `amount`, `flwTxRef` | 1 year |
| Withdrawal requested | `userId`, `amount`, `fee`, `bankAccount` | 1 year |
| KYC document upload | `userId`, `documentType`, `status` | 1 year |
| KYC level change | `userId`, `fromLevel`, `toLevel`, `reviewerId?` | 1 year |

Use `console.error` structured logging in V1 (JSON-formatted). Switch to a logging service (e.g., Logtail, Axiom) for production.

---

## Database Encryption

Sensitive fields are encrypted at the application layer before writing to PostgreSQL:

| Field | Method | Location |
|---|---|---|
| Password hashes | `bcryptjs` with cost factor 12 | `lib/auth.ts` |
| Phone numbers | AES-256-GCM via `lib/encryption.ts` | Before write to DB |
| KYC document references | Not stored — use Cloudinary secure URLs with signed delivery | `lib/cloudinary.ts` |

PostgreSQL column-level encryption (pgcrypto) is not used — all sensitive data is encrypted before it reaches Prisma. The encryption key lives in `ENCRYPTION_KEY` environment variable — never in the codebase.

---

## Secrets Checklist

Before any commit, verify:
- [ ] No hardcoded API keys or secrets anywhere in the codebase
- [ ] `.env.local` is in `.gitignore` — never committed
- [ ] No `console.log` statements printing sensitive data (tokens, user IDs, amounts)
- [ ] All new API routes have input validation
- [ ] All new protected API routes call `verifyAuth` or use `verifyAuthWithFallback`
- [ ] New environment variables are added to `.env.example` and documented in `rules/architecture.md`
- [ ] Security-sensitive code changes are reviewed by a second person before merging