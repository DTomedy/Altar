# rules/design-system.md — Altar

> Read before building any UI component or page.

---

## How the Styling System Works

This project uses **Tailwind CSS** for all layout, spacing, sizing, and structural styles. The `/tokens` folder provides the brand colours and fonts, which are registered in `tailwind.config.ts` so they are available as standard Tailwind utility classes.

You write Tailwind as normal. Colour and font classes automatically resolve to brand tokens.

```ts
// tailwind.config.ts
import { colors, fonts } from './tokens'

export default {
  theme: {
    extend: {
      colors: {
        primary:       colors.deepViolet,     // #3D1F6B
        'primary-hover': colors.midViolet,    // #6B3FA0
        accent:        colors.softLilac,      // #C084D4
        ghost:         colors.blushMist,      // #F5EEF9
        petal:         colors.petal,          // #E8D5F5
        'border-soft': colors.lavender,       // #D4A8E3
        success:       colors.trustGreen,     // #1D9E75
        'success-light': colors.mint,         // #5DCAA5
        page:          colors.offWhite,       // #F9F7FD
        body:          colors.charcoal,       // #2C2C2A
        error:         '#D93025',
      },
      fontFamily: {
        display: [fonts.display, 'sans-serif'],  // Plus Jakarta Sans
        body:    [fonts.body, 'sans-serif'],      // DM Sans
        mono:    [fonts.mono, 'monospace'],       // IBM Plex Mono
      },
    },
  },
}
```

**Never hardcode hex values or font names in component files.** Use the Tailwind classes.

---

## Colour Reference

| Tailwind class | Token | Hex | Usage |
|---|---|---|---|
| `bg-primary` / `text-primary` | `colors.deepViolet` | #3D1F6B | Primary actions, buttons, headings, logo |
| `hover:bg-primary-hover` | `colors.midViolet` | #6B3FA0 | Hover state on primary elements |
| `text-accent` / `bg-accent` | `colors.softLilac` | #C084D4 | Decorative accents, logo mark |
| `bg-ghost` | `colors.blushMist` | #F5EEF9 | Ghost button background, tag fills |
| `bg-petal` | `colors.petal` | #E8D5F5 | Soft card backgrounds |
| `border-border-soft` | `colors.lavender` | #D4A8E3 | Borders on cards and inputs |
| `text-success` / `bg-success` | `colors.trustGreen` | #1D9E75 | Success, funded, verified — **semantic only** |
| `text-success-light` | `colors.mint` | #5DCAA5 | Secondary success accents |
| `bg-page` | `colors.offWhite` | #F9F7FD | Page background |
| `text-body` | `colors.charcoal` | #2C2C2A | All body text |
| `text-body/60` / `text-body/40` | `colors.charcoal` + opacity | #2C2C2A | Muted body text, hints, metadata |
| `bg-surface` | `colors.neutral-100` | #FFFFFF | Card, modal, and elevated surface backgrounds |
| `bg-surface-muted` | `colors.neutral-96` | #F5F5F5 | Muted surface (hover, disabled background) |
| `text-muted` / `text-muted-strong` | `colors.neutral-50` / `colors.neutral-40` | #787878 / #666666 | Secondary text, placeholder text |
| `border-default` | `colors.neutral-90` | #E5E5E5 | Default border on cards and inputs |
| `text-error` / `bg-error` | — | #D93025 | Error states only |

**Critical rules:**
- `text-success` / `bg-success` are **semantic only** — never use them decoratively
- Never use red (`text-error`) for anything other than actual error states
- `bg-primary` with `text-white` is the only valid primary button combination
- Never use raw Tailwind neutral classes (`bg-neutral-100`, `text-neutral-500`) — use the mapped surface/muted classes above

---

## Typography Reference

### Font Families

| Tailwind class | Token | Font | Usage |
|---|---|---|---|
| `font-display` | `fonts.display` | Plus Jakarta Sans | Headings, hero text, campaign titles |
| `font-body` | `fonts.body` | DM Sans | Body copy, labels, UI text, button labels |
| `font-mono` | `fonts.mono` | IBM Plex Mono | **All naira amounts — no exceptions** |

### Type Scale

| Tailwind class | Size | Usage |
|---|---|---|
| `text-xs` | 12px | Captions, metadata, status badges |
| `text-sm` | 14px | Body text, input labels, helper text |
| `text-base` | 16px | Default body, card descriptions |
| `text-lg` | 18px | Large body, section intros |
| `text-xl` | 20px | Small headings, amounts |
| `text-2xl` | 24px | Section headings (h3) |
| `text-3xl` | 30px | Page headings (h2) |
| `text-4xl` | 36px | Hero headings (h1) |

### Font Weight Rules

- Use `font-normal` (400) and `font-semibold` (600) only
- **Never use `font-bold` or `font-extrabold`**
- Hierarchy is expressed through size and colour, never weight

### Examples

```tsx
// ✅ Correct
<h1 className="font-display font-semibold text-4xl text-primary">Ada's Birthday</h1>
<p className="font-body font-normal text-sm text-body/60">Help me celebrate turning 28</p>
<span className="font-mono font-semibold text-xl text-primary">₦120,000.00</span>

// ❌ Wrong — bold weight
<h1 className="font-bold text-4xl">Ada's Birthday</h1>
```

---

## Link Styles

```tsx
{/* Inline text link — for body copy */}
<a className="text-primary font-body font-semibold underline underline-offset-2 hover:text-primary-hover transition-colors">
  View campaign
</a>

{/* Navigation link — for nav bars and sidebars */}
<a className="font-body font-semibold text-body hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-ghost">
  Dashboard
</a>

{/* Muted link — for footer, secondary actions */}
<a className="font-body text-sm text-muted hover:text-body transition-colors">
  Privacy policy
</a>
```

- All links use `font-body` — never `font-display`
- Navigation links are never underlined — use colour change + background hover instead
- Inline text links always have `underline` + `underline-offset-2`

---

## Spacing & Layout

- Page max width: `max-w-5xl mx-auto px-4`
- Section gaps: `gap-6` or `gap-8`
- Minimum card padding: `p-5`
- Content must breathe — never use tight padding inside cards

### Responsive Breakpoints

Mobile-first is the default. Design for mobile first, then add breakpoints.

| Breakpoint | Tailwind | Target |
|---|---|---|
| Default | — | Mobile (320px+) |
| `sm` | `sm:*` | Tablet portrait (640px+) |
| `md` | `md:*` | Tablet landscape (768px+) |
| `lg` | `lg:*` | Desktop (1024px+) |
| `xl` | `xl:*` | Wide desktop (1280px+) |

- Use `flex-col md:flex-row` for stacking on mobile, row on desktop
- Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for responsive grids
- Never use `hidden` to create separate mobile/desktop markup — use responsive utilities on the same element

---

## Border Radius

| Element | Class | Shape |
|---|---|---|
| All buttons | `rounded-full` | Pill — non-negotiable |
| Cards | `rounded-2xl` | Large rounded |
| Inputs | `rounded-xl` | Medium rounded |
| Status badges | `rounded-full` | Pill |
| Images / cover photos | `rounded-xl` | Medium rounded |
| Modals | `rounded-2xl` | Large rounded |

**Never use `rounded-none` or `rounded-sm` on interactive or card elements.**

---

## Shadows & Depth

- **No decorative drop shadows** — never use `shadow-*` classes on cards, buttons, badges, or any surface-level element
- **Elevation shadow exception:** Modals and toasts may use `shadow-lg` for visual stacking above the page — these are the only allowed use of shadows
- **No gradients** — never use `bg-gradient-*` classes
- Depth is created through:
  - Background layering: `bg-page` → `bg-ghost` → `bg-surface`
  - Subtle borders: `border border-border-soft`
  - Text opacity: `text-body/60`, `text-body/40`

---

## Button System

```tsx
{/* Primary */}
<button className="bg-primary text-white font-body font-semibold px-6 py-2.5 rounded-full hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Give a gift
</button>

{/* Secondary */}
<button className="bg-transparent text-primary border border-primary font-body font-semibold px-6 py-2.5 rounded-full hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Create campaign
</button>

{/* Ghost */}
<button className="bg-ghost text-primary font-body font-semibold px-6 py-2.5 rounded-full hover:bg-petal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  View wishlist
</button>

{/* Destructive */}
<button className="bg-error text-white font-body font-semibold px-6 py-2.5 rounded-full hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
  Delete campaign
</button>

{/* Icon button (square) */}
<button className="p-2.5 rounded-full bg-ghost text-primary hover:bg-petal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  <Icon name="heart" className="w-5 h-5" />
</button>
```

---

## Icon System

- **Primary library:** Lucide React (`lucide-react`) — use by default
- **Secondary library:** Phosphor Icons (`@phosphor-icons/react`) — use when Lucide doesn't have the icon you need
- **Sizing:** Icons use `w-5 h-5` for default UI, `w-4 h-4` for inline/small, `w-6 h-6` for large
- **Colouring:** Icons inherit `currentColor` from the parent element by default
- **Button icons:** Always use `w-5 h-5` inside buttons. For icon-only buttons, use the icon button pattern above.

```tsx
import { Gift, Heart, Wallet, Share2, X, ChevronLeft, Check, AlertCircle } from 'lucide-react'

// In a button
<button className="...">
  <Gift className="w-5 h-5 mr-2" />
  Give a gift
</button>

// Icon-only close button
<button className="p-2 rounded-full hover:bg-ghost transition-colors">
  <X className="w-5 h-5 text-body" />
</button>
```

```tsx
import { Gift, Heart, Wallet, Share2, X } from '@phosphor-icons/react'

// Usage is identical — Phosphor icons also accept className
<Gift className="w-5 h-5" />
<Heart className="w-5 h-5 text-error" />
```

- Never import the full barrel (`import * from`) from either library — import individual icons by name
- Never wrap icons in custom SVG components — use the library directly
- Phosphor Icons provide weight variants via the `weight` prop: `thin`, `light`, `regular` (default), `bold`, `fill`, `duotone`. Prefer `regular` or `bold` for UI consistency.

---

## Status Badges

```tsx
{/* Funded */}
<span className="bg-success/10 text-success font-body font-semibold text-xs px-3 py-1 rounded-full">
  Fully funded
</span>

{/* Active */}
<span className="bg-ghost text-primary font-body font-semibold text-xs px-3 py-1 rounded-full">
  Active
</span>

{/* Anonymous */}
<span className="bg-surface-muted text-muted font-body font-semibold text-xs px-3 py-1 rounded-full">
  Anonymous gift
</span>

{/* Expired */}
<span className="bg-surface-muted text-muted font-body font-semibold text-xs px-3 py-1 rounded-full">
  Expired
</span>

{/* Error */}
<span className="bg-error/10 text-error font-body font-semibold text-xs px-3 py-1 rounded-full">
  Payment failed
</span>
```

---

## Progress Bar

```tsx
<div className="w-full bg-surface-muted rounded-full h-1.5">
  <div
    className="bg-primary rounded-full h-1.5 transition-all duration-300"
    style={{ width: `${Math.min(percentage, 100)}%` }}
  />
</div>
```

Fill is always `bg-primary` (Deep Violet). Never use `bg-success` for the fill.

---

## Loading & Empty States

### Skeleton Loader

```tsx
{/* Card skeleton */}
<div className="bg-surface border border-border-soft rounded-2xl p-5 animate-pulse">
  <div className="h-4 bg-surface-muted rounded w-3/4 mb-3" />
  <div className="h-3 bg-surface-muted rounded w-full mb-4" />
  <div className="h-6 bg-surface-muted rounded w-1/2 mb-2" />
  <div className="h-1.5 bg-surface-muted rounded-full w-full mb-1" />
  <div className="h-3 bg-surface-muted rounded w-1/3" />
</div>

{/* Text line skeleton */}
<div className="space-y-2">
  <div className="h-3 bg-surface-muted rounded w-full" />
  <div className="h-3 bg-surface-muted rounded w-5/6" />
  <div className="h-3 bg-surface-muted rounded w-4/6" />
</div>
```

- Use `animate-pulse` for skeleton animation — never custom keyframes
- Skeleton colors are always `bg-surface-muted`
- Match skeleton dimensions to the content they replace

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="w-16 h-16 rounded-full bg-ghost flex items-center justify-center mb-4">
    <Icon name="gift" className="w-8 h-8 text-accent" />
  </div>
  <h3 className="font-display font-semibold text-xl text-body mb-2">No campaigns yet</h3>
  <p className="font-body text-sm text-body/60 max-w-sm mb-6">Create your first wishlist or goal campaign to get started.</p>
  <button className="bg-primary text-white font-body font-semibold px-6 py-2.5 rounded-full">Create a campaign</button>
</div>
```

- Every list view must handle the empty state — never render a blank page
- Empty states include: icon + heading + description + optional CTA button
- Icon sits in a `rounded-full bg-ghost` circle with `text-accent` icon colour

---

## Form Inputs

### Text Inputs

```tsx
{/* Default */}
<input className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                  placeholder:text-body/40 transition-colors disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed" />

{/* Error state */}
<input className="w-full border border-error rounded-xl px-4 py-3 font-body text-body bg-white
                  focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error
                  placeholder:text-body/40 transition-colors disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed" />
<p className="text-error text-sm mt-1 font-body">This field is required</p>

{/* Textarea — same classes as input but with min-h-[120px] */}
<textarea className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white min-h-[120px] resize-y
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                     placeholder:text-body/40 transition-colors" />
```

### Checkboxes & Radios

```tsx
{/* Checkbox */}
<label className="flex items-start gap-3 font-body text-sm text-body cursor-pointer">
  <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border-soft text-primary
                                     focus:ring-2 focus:ring-primary/20 focus:outline-none
                                     disabled:opacity-50 disabled:cursor-not-allowed" />
  <span>Show my name on the contribution</span>
</label>

{/* Radio group */}
<fieldset className="space-y-3">
  <label className="flex items-center gap-3 font-body text-sm text-body cursor-pointer">
    <input type="radio" name="amount" className="w-4 h-4 border-border-soft text-primary
                                                  focus:ring-2 focus:ring-primary/20 focus:outline-none
                                                  disabled:opacity-50 disabled:cursor-not-allowed" />
    ₦5,000
  </label>
</fieldset>
```

### Select

```tsx
<select className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                   disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed">
  <option value="">Select campaign type</option>
  <option value="WISHLIST">Birthday Wishlist</option>
  <option value="GOAL">Goal Fundraiser</option>
</select>
```

---

## Campaign Card Pattern

```tsx
<div className="bg-surface border border-border-soft rounded-2xl p-5">
  <div className="flex justify-between items-start mb-3">
    <div>
      <h3 className="font-display font-semibold text-base text-body">{campaign.title}</h3>
      <p className="font-body text-sm text-body/60 mt-0.5 line-clamp-2">{campaign.description}</p>
    </div>
    <StatusBadge status={campaign.status} />
  </div>
  <p className="font-mono font-semibold text-xl text-primary">{formatNaira(campaign.totalRaised)}</p>
  <div className="w-full bg-surface-muted rounded-full h-1.5 mt-2 mb-1.5">
    <div className="bg-primary rounded-full h-1.5" style={{ width: `${percentage}%` }} />
  </div>
  <p className="font-body text-xs text-body/50">{percentage}% of {formatNaira(campaign.goalAmount)} goal</p>
</div>
```

---

## Modal System

```tsx
{/* Modal overlay + container */}
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/40" onClick={onClose} />
  
  {/* Modal panel */}
  <div className="relative bg-surface border border-border-soft rounded-2xl w-full max-w-md p-6 shadow-lg">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <h2 className="font-display font-semibold text-xl text-body">Confirm your gift</h2>
      <button className="p-1 rounded-full hover:bg-ghost transition-colors -mr-1 -mt-1" onClick={onClose}>
        <Icon name="x" className="w-5 h-5 text-body" />
      </button>
    </div>
    
    {/* Body */}
    <div className="font-body text-sm text-body/60 mb-6">
      Your contribution of <span className="font-mono font-semibold text-primary">₦5,000.00</span> will be sent to Ada's birthday wishlist.
    </div>
    
    {/* Footer */}
    <div className="flex gap-3">
      <button className="flex-1 bg-primary text-white font-body font-semibold px-6 py-2.5 rounded-full">Confirm</button>
      <button className="flex-1 bg-transparent text-primary border border-primary font-body font-semibold px-6 py-2.5 rounded-full" onClick={onClose}>Cancel</button>
    </div>
  </div>
</div>
```

- Modals use `z-50` — the highest z-index layer
- Backdrop uses `bg-black/40` — never custom opacity values
- Max width for standard modals: `max-w-md`. For large modals: `max-w-lg`
- Close button is always positioned top-right with a `p-1 rounded-full hover:bg-ghost` container

---

## Toast & Notification

```tsx
{/* Success toast */}
<div className="fixed top-4 right-4 z-50 bg-surface border border-border-soft rounded-2xl p-4 shadow-lg max-w-sm flex items-start gap-3 animate-slide-in">
  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
    <Icon name="check" className="w-4 h-4 text-success" />
  </div>
  <div>
    <p className="font-body font-semibold text-sm text-body">Payment successful</p>
    <p className="font-body text-xs text-muted mt-0.5">Your contribution has been received.</p>
  </div>
  <button className="p-0.5 rounded-full hover:bg-ghost shrink-0 -mr-1 -mt-1">
    <Icon name="x" className="w-4 h-4 text-muted" />
  </button>
</div>

{/* Error toast */}
<div className="fixed top-4 right-4 z-50 bg-surface border border-border-soft rounded-2xl p-4 shadow-lg max-w-sm flex items-start gap-3">
  <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0">
    <Icon name="alert-circle" className="w-4 h-4 text-error" />
  </div>
  <div>
    <p className="font-body font-semibold text-sm text-body">Payment failed</p>
    <p className="font-body text-xs text-muted mt-0.5">Insufficient funds. Please try again.</p>
  </div>
  <button className="p-0.5 rounded-full hover:bg-ghost shrink-0 -mr-1 -mt-1">
    <Icon name="x" className="w-4 h-4 text-muted" />
  </button>
</div>
```

- Toasts are positioned `fixed top-4 right-4 z-50` — same layer as modals
- Icon circle uses `bg-{color}/10` with `text-{color}` for the icon
- Always include a dismiss button
- Use `animate-slide-in` (defined in tailwind config) for entrance animation

---

## Avatar

```tsx
{/* Initials avatar */}
<div className="w-10 h-10 rounded-full bg-ghost flex items-center justify-center">
  <span className="font-body font-semibold text-sm text-primary">AB</span>
</div>

{/* Image avatar */}
<img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />

{/* Anonymous contributor placeholder */}
<div className="w-10 h-10 rounded-full bg-ghost flex items-center justify-center">
  <Icon name="user" className="w-5 h-5 text-accent" />
</div>
```

- Default avatar size: `w-10 h-10`. Small: `w-8 h-8`. Large: `w-12 h-12`
- Initials use `text-primary` on `bg-ghost` — always two uppercase letters
- Anonymous contributors get a user icon in `text-accent`

---

## Table Layout

```tsx
{/* Transaction history table */}
<div className="bg-surface border border-border-soft rounded-2xl overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-border-soft">
        <th className="font-body font-semibold text-xs text-muted uppercase tracking-wider text-left px-5 py-3">Date</th>
        <th className="font-body font-semibold text-xs text-muted uppercase tracking-wider text-left px-5 py-3">Description</th>
        <th className="font-body font-semibold text-xs text-muted uppercase tracking-wider text-right px-5 py-3">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-border-soft last:border-b-0 hover:bg-ghost transition-colors">
        <td className="font-body text-sm text-body px-5 py-3">12 Jun 2026</td>
        <td className="font-body text-sm text-body px-5 py-3">Contribution to Ada's Birthday</td>
        <td className="font-mono font-semibold text-sm text-primary text-right px-5 py-3">₦5,000.00</td>
      </tr>
    </tbody>
  </table>
</div>
```

- Table header cells use `text-xs uppercase tracking-wider text-muted`
- Table rows have `hover:bg-ghost` for row-level hover
- Last row removes the bottom border: `last:border-b-0`
- Monetary columns are `text-right` with `font-mono`
- Tables are wrapped in `bg-surface border border-border-soft rounded-2xl overflow-hidden`

---

## Copy Rules — Tone of Voice

| Never say | Say instead |
|---|---|
| Fundraising | Gifting / Celebrating |
| Donation | Gift / Contribution |
| Donate | Give / Contribute |
| Raise funds | Collect gifts / Reach your goal |
| Donor | Contributor / Friend |