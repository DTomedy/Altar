# rules/architecture.md — Altar

> Read before creating any file, folder, route, or database model.

---

## Project Structure

```
altar/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group — login, register, forgot password
│   ├── (dashboard)/              # Owner-only protected routes
│   │   ├── dashboard/            # Campaign list, wallet overview
│   │   ├── campaigns/
│   │   │   ├── new/              # Campaign creation flow
│   │   │   └── [id]/             # Campaign management
│   │   ├── wallet/               # Wallet balance, transactions, withdrawal
│   │   └── settings/             # Profile, KYC, bank account linking
│   ├── c/
│   │   └── [slug]/               # Public campaign page (contributor view)
│   ├── api/
│   │   ├── auth/                 # Login, register, refresh token
│   │   ├── campaigns/            # CRUD for campaigns and items
│   │   ├── contributions/        # Initiate and verify contributions
│   │   ├── wallet/               # Balance, withdrawal requests
│   │   ├── kyc/                  # KYC document submission
│   │   └── webhooks/
│   │       └── flutterwave/      # Flutterwave webhook handler
│   └── layout.tsx
├── components/
│   ├── ui/                       # Primitive components — Button, Input, Card, Badge, etc.
│   ├── campaign/                 # Campaign-specific components
│   ├── contribution/             # Contributor-facing components
│   ├── wallet/                   # Wallet and transaction components
│   └── layout/                   # Navbar, Sidebar, PageWrapper
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── flutterwave.ts            # Flutterwave SDK wrapper
│   ├── auth.ts                   # JWT sign/verify helpers
│   ├── cloudinary.ts             # File upload helpers
│   ├── email.ts                  # Resend email helpers
│   └── validators/               # Zod schemas for all API inputs
├── tokens/                       # Design tokens — colours and fonts (DO NOT EDIT)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types/                        # Shared TypeScript types and interfaces
├── hooks/                        # Custom React hooks
├── proxy.ts                      # Route protection for dashboard routes
└── .env.local                    # Never commit — all secrets live here
```

---

## Database Schema — Core Models

```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  passwordHash  String
  name          String
  phone         String?
  kycLevel      Int           @default(0)
  kycStatus     KycStatus     @default(PENDING)
  campaigns     Campaign[]
  wallet        Wallet?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Campaign {
  id            String        @id @default(cuid())
  slug          String        @unique
  title         String
  description   String
  type          CampaignType
  coverPhoto    String?
  goalAmount    Decimal?
  deadline      DateTime?
  status        CampaignStatus @default(ACTIVE)
  allowOverflow Boolean       @default(false)
  ownerId       String
  owner         User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  items         WishlistItem[]
  contributions Contribution[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([ownerId])
  @@index([status])
}

model WishlistItem {
  id            String        @id @default(cuid())
  campaignId    String
  campaign      Campaign      @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  name          String
  description   String?
  targetAmount  Decimal
  fundedAmount  Decimal       @default(0)
  isFulfilled   Boolean       @default(false)
  contributions Contribution[]

  @@index([campaignId])
}

model Contribution {
  id              String      @id @default(cuid())
  campaignId      String
  campaign        Campaign    @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  wishlistItemId  String?
  wishlistItem    WishlistItem? @relation(fields: [wishlistItemId], references: [id], onDelete: SetNull)
  amount          Decimal
  isAnonymous     Boolean     @default(false)
  displayName     String?
  message         String?
  status          PaymentStatus @default(PENDING)
  flwTxRef        String      @unique
  flwTxId         String?
  createdAt       DateTime    @default(now())

  @@index([campaignId])
  @@index([status])
  @@index([flwTxRef])
}

model Wallet {
  id              String        @id @default(cuid())
  userId          String        @unique
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance         Decimal       @default(0)
  transactions    WalletTransaction[]
}

model WalletTransaction {
  id          String              @id @default(cuid())
  walletId    String
  wallet      Wallet              @relation(fields: [walletId], references: [id], onDelete: Cascade)
  type        TransactionType
  amount      Decimal
  description String
  status      TransactionStatus   @default(COMPLETED)
  createdAt   DateTime            @default(now())

  @@index([walletId])
  @@index([createdAt])
}

enum CampaignType    { WISHLIST GOAL }
enum CampaignStatus  { ACTIVE GOAL_REACHED EXPIRED CLOSED }
enum KycStatus       { PENDING VERIFIED REJECTED }
enum PaymentStatus   { PENDING SUCCESS FAILED }
enum TransactionType { CREDIT DEBIT }
enum TransactionStatus { PENDING COMPLETED FAILED }
```

---

## Business Rules

### Campaign Types

| Type       | `goalAmount` | `deadline` | Wishlist items | Behavior                                                                |
| ---------- | ------------ | ---------- | -------------- | ----------------------------------------------------------------------- |
| `WISHLIST` | Optional     | Optional   | Required (≥ 1) | Contributions can be allocated to specific items. No deadline required. |
| `GOAL`     | Required     | Required   | None           | Contributions go to the general goal. Campaign expires at deadline.     |

### KYC Levels

| Level | Meaning              | Requirements                         | Grants access to                |
| ----- | -------------------- | ------------------------------------ | ------------------------------- |
| 0     | Unverified (default) | Email + password                     | Browsing, viewing campaigns     |
| 1     | Identity verified    | Government ID upload matching name   | Creating campaigns, wallet view |
| 2     | Bank linked          | Bank account verified with BVN match | Withdrawal                      |

Wallet creation requires KYC Level ≥ 1. Withdrawal requires KYC Level ≥ 2.

---

## Routing Rules

- All dashboard routes are protected via `proxy.ts` — redirect to `/login` if no valid JWT
- Campaign pages at `/c/[slug]` use **SSR (dynamic rendering)** — not static generation. This ensures Open Graph meta tags, wallet balance, and campaign status are always current when shared via WhatsApp. Auth is not required.
- API routes under `/api/webhooks/` are public but verified via Flutterwave signature
- API routes under `/api/wallet/` and `/api/kyc/` require auth middleware

---

## API Conventions

### Response Format

All API responses follow a consistent envelope:

```typescript
// Success
{ "data": T }

// Error
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }

// Paginated list
{ "data": T[], "pagination": { "page": number, "limit": number, "total": number, "totalPages": number } }
```

### Pagination

- All list endpoints accept `?page=1&limit=20` query parameters
- Default limit is 20, maximum is 100
- Responses include the `pagination` envelope above
- Use cursor-based pagination for transaction history (high write volume); page-based for campaigns and contributions

### Error Codes

| Code               | HTTP Status | Meaning                              |
| ------------------ | ----------- | ------------------------------------ |
| `UNAUTHORIZED`     | 401         | Missing or invalid JWT               |
| `FORBIDDEN`        | 403         | Valid JWT but insufficient KYC level |
| `NOT_FOUND`        | 404         | Resource does not exist              |
| `VALIDATION_ERROR` | 422         | Input failed Zod validation          |
| `CONFLICT`         | 409         | Duplicate or conflicting state       |
| `RATE_LIMITED`     | 429         | Too many requests                    |
| `INTERNAL_ERROR`   | 500         | Unexpected server error              |

---

## Key Architectural Decisions

- **Slug over ID for campaign URLs** — campaigns are shared publicly; use readable slugs (e.g. `/c/ada-birthday-2026`), not database IDs
- **Wallet is server-side only** — never expose raw wallet balance via client-side fetch without auth verification
- **Contributions are created optimistically then verified** — create a PENDING contribution on payment initiation, update to SUCCESS only after Flutterwave webhook confirms
- **Platform fee is deducted at withdrawal** — not at contribution time. The wallet holds the full contributed amount. Fee (3%) is calculated and deducted when the owner initiates a withdrawal.
- **Prisma client is a singleton** — always import from `lib/prisma.ts`, never instantiate `new PrismaClient()` elsewhere
- **Webhook idempotency** — Flutterwave may deliver the same webhook event multiple times. Before processing a payment success event: (1) look up the Contribution by `flwTxRef`, (2) if `status` is already `SUCCESS`, skip, (3) otherwise update to `SUCCESS` and credit the campaign raised total and wallet balance inside a `prisma.$transaction`.
- **Transaction atomicity** — operations that touch multiple models must use `prisma.$transaction`. Examples: Contribution SUCCESS → credit Campaign raised amount + credit Wallet balance. Withdrawal → debit Wallet balance + create WalletTransaction. Campaign deletion → delete related Contributions and WishlistItems. If any step fails, all changes roll back.

---

## Security

### Rate Limiting

| Endpoint group            | Limit       | Scope  |
| ------------------------- | ----------- | ------ |
| `POST /api/auth/*`        | 10 req/min  | Per IP |
| `POST /api/contributions` | 30 req/min  | Per IP |
| All other API routes      | 100 req/min | Per IP |

Use a sliding window approach (Vercel KV in production, in-memory with `lru-cache` in development).

### JWT Strategy

- **Algorithm:** `HS256`
- **Expiry:** `JWT_EXPIRES_IN` (default 7 days)
- **Storage:** `httpOnly` secure cookie — never exposed to client JavaScript
- **Refresh tokens:** None in V1. On expiry the user re-authenticates.
- **Blacklisting:** Not required in V1 — short-lived tokens + `httpOnly` cookie mitigate common attack vectors
- **Payload:** `{ userId: string, email: string, kycLevel: number }` — never include sensitive data

---

## File Upload

All uploads go through Cloudinary via the server-side `lib/cloudinary.ts` wrapper — never from the client directly.

| Use                  | Max size | Accepted formats | Recommended dimensions |
| -------------------- | -------- | ---------------- | ---------------------- |
| Campaign cover photo | 5 MB     | JPEG, PNG, WebP  | 1200×630 (OG ratio)    |
| KYC documents        | 10 MB    | JPEG, PNG, PDF   | —                      |

---

## Environment Variables

```bash
# Database
DATABASE_URL=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_WEBHOOK_HASH=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_FLW_PUBLIC_KEY=
```

Never commit `.env.local`. Never reference `process.env` outside of `lib/` files or Next.js config.
