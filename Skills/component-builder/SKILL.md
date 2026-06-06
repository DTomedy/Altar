# Skills/component-builder/SKILL.md — Altar

> Read before scaffolding any React component.
> This project uses **Tailwind CSS** with brand token classes from `/tokens` — never use inline styles or hardcoded values.
> See `rules/design-system.md` for the full colour, typography, and spacing class reference.

---

## Component Checklist

Before building any component, answer these questions:

1. Is this a Server Component or Client Component?
   - Default to Server Component
   - Add `'use client'` only if it needs: `useState`, `useEffect`, event handlers, browser APIs, or Flutterwave inline JS
   - Never import server-only modules (prisma, `@/lib/auth`) into client components
2. Does it display a naira amount? → Use `font-mono` and `formatNaira()`
3. Does it have a status? → Use the standard badge pattern from `rules/design-system.md`
4. Is it a card? → Use `rounded-2xl`, `border border-border-soft`, `p-5`, `bg-surface`, no shadows
5. Is it a button? → Always `rounded-full`, use one of the four button variants (primary / secondary / ghost / destructive)
6. Are any values hardcoded? → Replace with the correct Tailwind token class from `rules/design-system.md`

---

## File Location Rules

| Component type | Location |
|---|---|
| Primitive UI (Button, Input, Card, Badge) | `components/ui/` |
| Campaign-related (CampaignCard, CampaignForm, WishlistItem) | `components/campaign/` |
| Contributor-facing (PaymentButton, ContributorForm, AnonToggle) | `components/contribution/` |
| Wallet & transactions | `components/wallet/` |
| Layout (Navbar, Sidebar, PageWrapper) | `components/layout/` |

---

## Component Template — Server Component

```tsx
// components/campaign/CampaignCard.tsx

import { formatNaira } from '@/lib/formatters'
import { Campaign } from '@/types'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/campaign/StatusBadge'

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const percentage = campaign.goalAmount
    ? Math.min(Math.round((Number(campaign.totalRaised) / Number(campaign.goalAmount)) * 100), 100)
    : 0

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-medium text-base text-body truncate">{campaign.title}</h3>
          <p className="font-body text-sm text-body/60 mt-0.5 line-clamp-2">{campaign.description}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <p className="font-mono font-medium text-xl text-primary">{formatNaira(campaign.totalRaised)}</p>

      {campaign.goalAmount && (
        <>
          <div className="w-full bg-surface-muted rounded-full h-1.5 mt-2 mb-1.5">
            <div
              className="bg-primary rounded-full h-1.5 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="font-body text-xs text-body/50">{percentage}% of {formatNaira(campaign.goalAmount)} goal</p>
        </>
      )}
    </Card>
  )
}
```

---

## Component Template — Client Component

```tsx
// components/contribution/AnonToggle.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AnonToggleProps {
  onChange: (isAnonymous: boolean) => void
}

export function AnonToggle({ onChange }: AnonToggleProps) {
  const [isAnonymous, setIsAnonymous] = useState(false)

  function toggle() {
    const next = !isAnonymous
    setIsAnonymous(next)
    onChange(next)
  }

  return (
    <button type="button" onClick={toggle} className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0">
      <div
        className={cn(
          'w-9 h-5 rounded-full flex items-center p-0.5 transition-colors duration-200',
          isAnonymous ? 'bg-primary' : 'bg-surface-muted'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 bg-white rounded-full transition-transform duration-200',
            isAnonymous && 'translate-x-4'
          )}
        />
      </div>
      <span className="font-body text-sm text-body/70">Give anonymously</span>
    </button>
  )
}
```

---

## Primitive UI Components to Build First

Build these before any feature components — all feature components compose from these.

All primitives use Tailwind token classes. Never use inline styles — the only exception is dynamic values (e.g. progress bar width).

### Button

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white border-none hover:bg-primary-hover',
  secondary: 'bg-transparent text-primary border border-primary hover:bg-ghost',
  ghost: 'bg-ghost text-primary border-none hover:bg-petal',
  destructive: 'bg-error text-white border-none hover:opacity-90',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-1 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'font-body font-medium rounded-full cursor-pointer transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing...
        </span>
      ) : children}
    </button>
  )
}
```

### Input

```tsx
// components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, id, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="font-body text-sm font-medium text-body">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full border rounded-xl px-4 py-3 font-body text-body bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          'placeholder:text-body/40 transition-colors',
          'disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed',
          error ? 'border-error focus:border-error focus:ring-error/20' : 'border-border-soft focus:border-primary',
          className,
        )}
        {...props}
      />
      {error && (
        <p className="font-body text-sm text-error m-0">{error}</p>
      )}
    </div>
  )
)
Input.displayName = 'Input'
```

### Card

```tsx
// components/ui/Card.tsx
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md'
}

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border-soft rounded-2xl',
        padding === 'md' ? 'p-5' : 'p-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

### Badge

```tsx
// components/ui/Badge.tsx
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const badgeClasses: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  neutral: 'bg-ghost text-body/60',
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'font-body text-xs font-medium px-2.5 py-0.5 rounded-full inline-block',
        badgeClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

---

## Common Mistakes to Avoid

- Never hardcode any colour, font, spacing, or radius value — use Tailwind token classes (e.g. `bg-primary`, not `#3D1F6B`)
- Never use inline `style={}` objects — use Tailwind classes. The only exception is dynamic values (e.g. progress bar width)
- Never use `<form>` without a Zod-validated submit handler
- Never show raw database IDs in the UI — use slugs for campaigns
- Never place the Flutterwave Script tag at the page level — co-locate it in `PaymentButton`
- Never build a modal from scratch — create a shared `Modal` component in `components/ui/`
- Never format naira amounts manually — always use `formatNaira()`
- Never use `font-bold`, `font-semibold`, or weight above `font-medium` (500)
- Never forget disabled styling — every interactive element must handle `disabled` state