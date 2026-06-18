# AGENTS.md — Altar
> Read this file first and completely before taking any action. It is the entry point for all agent work on this codebase.

---

## What is Altar?

Altar is a personal crowdfunding web application for the Nigerian market. Users create a campaign — either a birthday wishlist or a goal-based fundraiser — share a single link, and receive contributions directly into an in-app wallet they control.

**Altar is not a charity or donation platform. It is a celebration and gifting tool.**
Every UI decision, copy choice, and product feature must reflect this.

**Tagline:** Give with intention.

**Three non-negotiable principles:**
- Trust — contributors must feel safe sending money to a link
- Simplicity — link to payment must require minimal friction
- Security — funds must be protected at every stage

---

## Agent Rules & Reference Files

Before writing any code, read the relevant rule and skill files below.

### Rules (always apply)
| File | When to read |
|---|---|
| `rules/architecture.md` | Before creating any file, folder, route, or database model |
| `rules/code-style.md` | Before writing any TypeScript, React, or API code |
| `rules/design-system.md` | Before building any UI component or page |
| `rules/security.md` | Before touching auth, payments, KYC, wallets, or any API route |

### Skills (read before the relevant task)
| File | When to read |
|---|---|
| `Skills/flutterwave-integration/SKILL.md` | Before any payment initiation, verification, or webhook work |
| `Skills/component-builder/SKILL.md` | Before scaffolding any React component |
| `Skills/api-route-scaffolder/SKILL.md` | Before creating any Next.js API route |
| `Skills/db-migration-runner/SKILL.md` | Before creating or modifying any Prisma schema or migration |

---

## Tech Stack — Locked

Do not deviate from this stack without explicit instruction from the user.

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript — strict mode, no `any` |
| Database | PostgreSQL |
| ORM | Prisma |
| Payment gateway | Flutterwave (primary and only) |
| Authentication | JWT (custom) — no NextAuth in V1 |
| File storage | Cloudinary (cover photos + KYC uploads) |
| Email | Resend |
| Styling | Tailwind CSS + design system tokens from `/tokens` |
| Deployment | Vercel |

---

## Styling Approach

This project combines two systems:

- **Tailwind CSS** — handles all layout, spacing, sizing, border radius, shadows, and structural styles via utility classes
- **Design system `/tokens`** — provides the official brand colours and fonts, configured into `tailwind.config.ts` so they are available as Tailwind classes

The result: you write Tailwind classes normally, but colour and font classes (`text-primary`, `bg-primary`, `font-display`, `font-body`, `font-mono`) resolve to the brand tokens automatically.

**Never hardcode hex values or font names.** Always use the Tailwind classes that map to tokens.

Refer to `rules/design-system.md` for the full class reference.

---

## Code Generation Conventions

| Concern | Convention | Example |
|---|---|---|
| Components | PascalCase, named exports only | `CampaignCard.tsx` — `export function CampaignCard()` |
| Hooks | camelCase with `use` prefix | `useCampaign.ts` |
| API route files | Lowercase, folder-per-route | `app/api/campaigns/[id]/route.ts` |
| Utils | camelCase | `formatNaira.ts` |
| Types & interfaces | PascalCase | `CampaignWithItems` |
| Prisma enums | SCREAMING_SNAKE | `CampaignStatus.ACTIVE` |
| Props type | `ComponentNameProps` above component | `interface CampaignCardProps` |
| Default export | Never — all exports are named | `export function CampaignCard()` |
| Server components | Default — add `'use client'` only when necessary | |
| Migration names | Lowercase, hyphenated, descriptive | `add-kyc-level-to-user` |

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

---
## Error & Edge Case Handling

Handle every scenario below. Do not leave these as undefined states.

| Scenario | Expected behaviour |
|---|---|
| Campaign reaches funding goal | Notify owner via email and dashboard. Owner chooses: close contributions or allow overflow |
| Campaign expires without reaching goal | Notify owner. Collected funds stay in wallet. Owner may withdraw or delete the campaign (refunds contributors pro rata) |
| Contributor payment fails | Show clear failure message with reason if available. Allow retry without re-entering details |
| Withdrawal fails or is delayed | Notify owner via email and dashboard. Provide a support contact path |
| Duplicate contribution from same contributor | Allow it. Show confirmation prompt: "You've already contributed to this campaign. Continue?" |
| Contributor enters invalid custom amount | Validate on the frontend. Show inline error. Minimum contribution: ₦500 |
| Campaign link accessed after expiry | Show a graceful expired campaign page. Never show a blank or broken page |
| KYC document upload fails | Show retry option with clear instructions. Do not block wallet access — only block withdrawal |

---

## Git Convention

- **Branch naming:** `type/short-description` — e.g. `feat/wallet-withdrawal`, `fix/campaign-expiry`, `chore/update-deps`
- **Commit style:** Conventional Commits — `type(scope): message` — e.g. `feat(wallet): add withdrawal endpoint`, `fix(campaign): handle expired campaign page`
- **Allowed types:** `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`
- **Scope:** Lowercase, matches the area of change — `api`, `ui`, `db`, `auth`, `payments`, `config`
- **PRs:** Create only when explicitly asked. Include summary, screenshots if UI changes, and link to related issue.
- **No force-push.** No empty commits.

---

## Verification

Before submitting any code, run all checks below and fix any failures:

| Check | Command | Notes |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Strict mode — no `any` allowed |
| Lint | `npm run lint` | ESLint (Next.js config) |
| Format | `npx prettier --check .` | If Prettier is configured |
| Tests | `npm run test` | Run the full suite — fix failing tests before submitting |

If the project is pre-scaffold and these commands are unavailable, skip and verify manually.

---
## Market Context

Understanding the market helps agents make better product decisions.

- **Primary market:** Nigeria — Lagos first, then Abuja, Port Harcourt, Enugu, Ibadan
- **Primary distribution channel:** WhatsApp link sharing — every campaign page must look trustworthy and render correctly as a WhatsApp link preview
- **Primary competitor:** Crowdr (oncrowdr.com) — charges 5% fee, no wishlist, no wallet hold, no anonymous donations, manual withdrawal coordination
- **Secondary competitor:** NaijaFund — charges 8% fee, similar feature gaps
- **Key insight:** No Nigerian platform offers wishlist campaigns + in-app wallet + anonymous donations. This is Altar's defensible product gap.
- **User behaviour:** Nigerians already pool birthday and event contributions manually via WhatsApp. Altar digitises this existing behaviour — it is not creating a new habit.
- **Trust is the primary barrier:** Fraud is the top reason Nigerians do not send money to unfamiliar links. Every screen must make trust visible.

### Target users
- Urban professionals aged 18–40, smartphone-first, WhatsApp-heavy
- Comfortable with Paystack, bank transfer, and USSD
- Frequent celebrators — birthdays, weddings, graduations, naming ceremonies


## User Roles

Two roles only. Never build for a third.

| Role | Account required | Primary action |
|---|---|---|
| Campaign Owner | Yes — registered user | Creates campaigns, manages wallet, withdraws funds |
| Contributor | No | Visits campaign link, selects amount, pays |

---

## Out of Scope — V1

Never build these, even if asked:
- Business or corporate fundraising
- Investment or equity-based funding
- Recurring or subscription donations
- Comments, social feeds, or community features
- In-app messaging
- Multi-currency wallet
- Native mobile apps
- White-label or third-party API access

---

## Communication

When reporting back to the user:
- Be concise — state the answer first, provide context only if needed
- Use file:line references when mentioning code (e.g. `src/app/page.tsx:42`)
- Avoid emojis, preambles, and postambles

---

## Guardrails

- Never store contributor payment card details on Altar servers
- Never hardcode secrets — use environment variables only
- Never expose `process.env` in client components — only `NEXT_PUBLIC_` prefixed vars are safe on the client
- Never use font weights above 500 (`font-semibold`)
- Never use drop shadows or gradients in the UI
- Never use red for anything other than error states
- Never use the words "fundraising" or "donation" in UI copy — use "gifting", "celebrating", "giving"
- Always validate contribution amounts on the frontend before API submission
- Always display platform fees before payment is completed
- If a requirement is unclear, ask one clarifying question — never guess

---

*Altar AGENTS.md — v1.0 — June 2026*