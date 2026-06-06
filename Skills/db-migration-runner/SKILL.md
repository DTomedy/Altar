# Skills/db-migration-runner/SKILL.md — Altar

> Read before creating or modifying any Prisma schema or migration.

---

## ORM & Database

- ORM: **Prisma**
- Database: **PostgreSQL**
- Schema file: `prisma/schema.prisma`
- Migrations folder: `prisma/migrations/`
- Client singleton: `lib/prisma.ts` — always import from here, never instantiate `new PrismaClient()` elsewhere

---

## Prisma Client Singleton

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Migration Commands

```bash
# Create and apply a new migration (development)
npx prisma migrate dev --name <migration-name>

# Apply migrations in production (no schema changes)
npx prisma migrate deploy

# Reset the database (development only — destroys all data)
npx prisma migrate reset

# Generate migration SQL without applying (review before committing)
npx prisma migrate dev --create-only

# Generate Prisma client after schema change
npx prisma generate

# Open Prisma Studio (visual database browser)
npx prisma studio

# Validate schema without migrating
npx prisma validate
```

---

## Migration Naming Convention

Use descriptive, lowercase, hyphenated names:

```bash
# Good
npx prisma migrate dev --name add-kyc-level-to-user
npx prisma migrate dev --name create-wallet-transactions-table
npx prisma migrate dev --name add-slug-to-campaign

# Bad
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
npx prisma migrate dev --name migration1
```

---

## Schema Rules

### Decimal for All Money Fields

```prisma
// ✅ Always Decimal for monetary values
amount       Decimal
balance      Decimal   @default(0)
goalAmount   Decimal?
targetAmount Decimal

// ❌ Never Float or Int for money
amount       Float    // forbidden — float precision issues with currency
amount       Int      // forbidden — loses decimal precision
```

### Always Include Timestamps

```prisma
createdAt  DateTime  @default(now())
updatedAt  DateTime  @updatedAt
```

Every model except junction tables must have `createdAt` and `updatedAt`.

### Use CUID for IDs

```prisma
id  String  @id @default(cuid())
```

Never use auto-increment integers for public-facing IDs.

### Explicit Foreign Keys & Cascades

```prisma
// ✅ Always name the relation field and foreign key explicitly
ownerId  String
owner    User    @relation(fields: [ownerId], references: [id], onDelete: Cascade)

// ✅ Always define onDelete for every relation:
//    Cascade  — delete children when parent is deleted
//    SetNull  — set FK to null when parent is deleted
//    Restrict — prevent parent deletion if children exist

// ❌ Never rely on Prisma's implicit relation naming or default cascade
```

---

## Current Schema Overview

```
User          — platform accounts (campaign owners only)
Campaign      — wishlist or goal campaigns
WishlistItem  — individual items within a wishlist campaign
Contribution  — every payment attempt (PENDING/SUCCESS/FAILED)
Wallet        — one per User, holds balance
WalletTransaction — every credit and debit on a wallet
```

---

## Adding a New Model — Checklist

Before adding a model, confirm:
- [ ] Does this belong in a new table, or is it an extension of an existing model?
- [ ] Does it need `createdAt` / `updatedAt`?
- [ ] Does it reference another model? → Define the relation and foreign key explicitly
- [ ] Does it store money? → Use `Decimal`
- [ ] Does it have a status field? → Define it as a Prisma enum, not a string
- [ ] Will it be queried by something other than `id`? → Add `@index` or `@unique` as needed
- [ ] Does it reference another model? → Define `onDelete: Cascade`, `SetNull`, or `Restrict` on the relation

---

## Modifying an Existing Model — Rules

- Never rename a field directly — Prisma will drop the old column and create a new one, losing data. Instead:
  1. Add the new field as optional
  2. Write a data migration script to backfill
  3. Make the field required in a follow-up migration
  4. Drop the old field last

- Never drop an enum value that existing records use
- Always run `npx prisma validate` before `migrate dev`
- Always review the generated SQL in `prisma/migrations/` before applying to production
- Always use `prisma.$transaction` for operations that touch multiple models — if any step fails, all changes roll back. Examples: credit contribution + update wallet + log transaction; debit wallet + deduct balance + log withdrawal
- Always validate generated SQL with `--create-only` when working on shared branches to avoid conflicting migration histories

---

## Seeding (Development Only)

```ts
// prisma/seed.ts
import { prisma } from '../lib/prisma'

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@altar.app' },
    update: {},
    create: {
      email: 'test@altar.app',
      passwordHash: '$2a$12$...', // bcrypt hash of 'password123'
      name: 'Test User',
      phone: '+2348012345678', // Encrypt via lib/encryption.ts in production
      kycLevel: 2,
      kycStatus: 'VERIFIED',
    }
  })

  // Create a test campaign
  await prisma.campaign.upsert({
    where: { slug: 'test-birthday-abc123' },
    update: {},
    create: {
      slug: 'test-birthday-abc123',
      title: "Ada's Birthday Wishlist",
      description: 'Help me celebrate turning 28!',
      type: 'WISHLIST',
      status: 'ACTIVE',
      allowOverflow: false,
      ownerId: user.id,
    }
  })

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run with:
```bash
npx prisma db seed
```

Add to `package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```