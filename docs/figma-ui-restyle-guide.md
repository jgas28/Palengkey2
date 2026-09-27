# Figma UI Restyle Guide

Reference doc for applying the Figma Make design ("Redesign UI for All Platforms") to the
rest of Palengkey 2.0. Part of the app is already restyled (see "Already applied" below);
this doc exists mainly to spec out what's left — **Cart → Checkout → Payment → Confirmation
→ Orders → Delivery/Tracking**, plus a write-up of the **Paluto** scheme as a worked example.

This is a living spec, not a one-time plan — update it as pages get restyled or the design
system tokens change.

## How to use this doc

Each remaining page/component below lists: what it does today, and what to change. Nothing
here invents new data, statuses, payment methods, or UI concepts that don't exist in the
backend — see **Guardrails** before adding anything that looks like it needs new data.

## 1. Design system reference

Source: the Figma Make export, adapted to fit this project's existing Tailwind v3 setup and
custom UI kit (no shadcn/Radix, no Tailwind v4) — see `tailwind.config.ts` and
`.claude/skills/palengkey-frontend/SKILL.md` for the authoritative rules. Summary:

**Typography**
- Headings/display numbers: `font-display` (Playfair Display) — page titles, section
  headings, stat numbers, prices shown large. Not for body copy, labels, or buttons.
- Body/UI text: default `font-sans` (DM Sans) — already the Tailwind default, no class needed.
- Most checkout/orders pages today use plain `font-bold`/`font-semibold` with no
  `font-display` — that's the main typographic gap to close.

**Icons**
- `lucide-react` for everything. No new inline `<svg>` icons, no emoji used as UI icons
  (emoji is fine in copy/tone, e.g. "🍲 New — Paluto" banners, but not as a clickable icon or
  a status/graphic element).
- Reuse one icon consistently for the same concept across the app (e.g. `MapPin` for every
  address heading, `Clock` for every time/cutoff reference) — see the swap table in §4.

**Color / shape tokens** (already defined, do not add new ones without reason)
- Colors: `primary`/`primary-50..900`, `accent`/`accent-50..900`, `background`, `surface`,
  `text`/`text-muted`, `border`, `status-*` (received/confirmed/preparing/outForDelivery/
  delivered/cancelled).
- Radii: `rounded-card` (20px, standard card), `rounded-pill` (badges/buttons/chips).
- Shadows: `shadow-soft` (resting card), `shadow-card` (hover), `shadow-lifted` (modals/
  emphasis). Never introduce `shadow-2xl` or decorative blurred-circle backgrounds outside
  the marketing pages that already use them sparingly (Global, About, Careers heroes).

**Restraint rules** (from the project's own design skill — these are why the Figma export
isn't copied verbatim anywhere in this app)
- No heavy gradients, glassmorphism, or decorative blur except the existing semantic
  `gradient-status-*`/`gradient-brand` tokens.
- No `animate-pulse`/scale-on-hover flourishes beyond what's already established
  (`active:scale-[0.97]` on buttons, `hover:-translate-y-0.5` on cards).
- Never invent data to fill a nicer-looking layout (ratings, sold counts, discount badges,
  fake stats) — see Guardrails.

## 2. Status overview

| Area | Status | Notes |
|---|---|---|
| Header / Footer / BottomNav / AuthLayout | ✅ Done | lucide icons, `font-display` wordmark |
| Landing (`Global.tsx`) | ✅ Done | + curated products & hero-stats CMS |
| Shop catalog (`Home.tsx`, `ProductCard`, `FilterChips`) | ✅ Done | |
| Cart (`Cart.tsx`, `CartItemRow.tsx`) | ✅ Done | fee logic untouched, visuals only |
| Login / Register | ✅ Done | password show/hide added |
| About / FAQ / Careers / NotFound | ✅ Done | |
| Paluto (`Paluto.tsx` + `features/paluto/*`) | ✅ Done | see §3 for the scheme used |
| **Checkout (`CheckoutForm.tsx`)** | ❌ Not started | §5.1 |
| **Voucher picker (`VoucherListDrawer.tsx`)** | ❌ Not started | §5.2 |
| **Payment screens (QRPh/BPI, `PaymentScreen.tsx`)** | ❌ Not started | §5.3 |
| **Order confirmation (`OrderConfirmation.tsx`)** | ❌ Not started | §5.4 |
| **Orders list (`Orders.tsx`, `OrderCard.tsx`)** | ❌ Not started | §5.5 |
| **Order detail + tracking (`OrderDetailView.tsx`, `RiderTrackingCard.tsx`, `OrderStatusTimeline.tsx`)** | ❌ Not started | §5.6 |
| **Feedback modal (`FeedbackModal.tsx`)** | ❌ Not started | §5.7 |

## 3. The Paluto scheme (reference example)

`src/pages/Paluto.tsx` + `src/features/paluto/{RecipeCard,RecipeDetailDrawer,CartRecipeBundleRow}.tsx`
is the closest existing example of the target pattern applied to a real, API-backed flow —
use it as the template for the checkout/orders work below.

What was done there, concretely:
- Page heading switched to `font-display text-xl font-bold text-white` (was plain `font-bold`).
- Every emoji icon replaced 1:1 with a lucide icon of matching meaning: 🍲 → `ChefHat`
  (empty states, card image fallback, "Paluto — have it cooked at a stall" section heading),
  chevron-in-a-circle inline SVG → `ChevronRight` (recipe card corner button).
- Category filter chips got a shared visual treatment: active = `bg-primary-500 text-white
  shadow-soft`, inactive = `border-border bg-surface text-text-muted
  hover:border-primary-300 hover:text-primary`, `transition-all` on both.
- Card thumbnails: `ImageOff` (lucide) as the broken/missing-image fallback instead of an
  emoji or inline SVG placeholder.
- **Nothing about the underlying data or IA changed** — real `listRecipes`/`RecipeDetail`/
  `PalutoStall` API data throughout, no mock ingredients, no fabricated "ingredient
  availability ratio" (that idea came from the original Figma mock and isn't backed by real
  data — it was deliberately dropped, see Guardrails).
- The Ingredients + Stalls content stayed as a single flowing drawer (no tabs) because
  there's no real "Steps" content (no cooking-instructions field in the backend) — forcing a
  tabbed Ingredients/Steps/Stalls layout like the Figma mock would mean inventing a Steps tab
  with nothing in it.

Apply the same pattern to checkout/orders: swap icons and typography, tone down the source
material's decorative excess, change nothing about data flow or add fields that don't exist.

## 4. Icon swap reference

Every one of these appears today as an emoji or a hand-rolled inline `<svg>` somewhere in the
checkout/orders/tracking flow. Replace with the listed `lucide-react` icon.

| Current | Where | Replace with |
|---|---|---|
| 📍 | Delivery address headings (`CheckoutForm.tsx`, `OrderDetailView.tsx`) | `MapPin` |
| ⏰ | Delivery time / cutoff note (`CheckoutForm.tsx`) | `Clock` |
| 🎟️ | Voucher heading, empty state, list item badge (`CheckoutForm.tsx`, `VoucherListDrawer.tsx`) | `Ticket` |
| ✓ (text) | Applied-voucher confirmation (`CheckoutForm.tsx`) | `Check` |
| 💵 | "Cash on Delivery" payment option | `Banknote` |
| 📱 | "QR Ph" payment option | `QrCode` |
| 🏦 | "BPI" payment option | `Landmark` |
| 🛵 | Rider tracking card heading (`RiderTrackingCard.tsx`) | `Bike` |
| 🧾 | Orders empty state (`Orders.tsx`) | `ReceiptText` |
| Inline SVG checkmark-in-circle | `OrderConfirmation.tsx` (success badge) and `OrderStatusTimeline.tsx` (completed step markers) — same SVG duplicated in both | `Check` or `CheckCircle2` — one shared usage |
| Inline SVG phone | `RiderTrackingCard.tsx` call button | `Phone` |
| `★` unicode | `FeedbackModal.tsx` star rating | `Star` (filled vs. outline via `fill-accent`/`text-border`, same as Global.tsx's review stars) |

## 5. Remaining work, page by page

### 5.1 Checkout — `src/features/checkout/CheckoutForm.tsx`

Current: single `max-w-2xl` column, plain `text-lg font-bold` heading, sections for address /
order items / cutoff notice / voucher / payment method / price breakdown / place-order button.
All real data (`useCart`, `listAddresses`, `getSettings`, `getDeliveryFee`, `validateVoucher`,
`checkout` mutation) — do not touch the data flow, only the presentation layer.

Changes:
- `<h1>Checkout</h1>` → `font-display text-2xl font-bold text-text`.
- Section headings ("Delivery Address", "Your Order", etc.) get their matching icon from §4
  next to the text (`flex items-center gap-1.5`), matching the pattern already used in
  `RecipeDetailDrawer.tsx`'s "🍲 Paluto — have it cooked at a stall" → icon+text heading.
- Payment method list: replace the emoji-in-`<span className="text-xl">` icons with the
  lucide icons from §4, sized `20`, inside the existing selected/unselected pill styling
  (`border-primary bg-primary-50` selected / `border-border` unselected) — **do not add a
  4th payment method**; only `cod`/`qrph`/`bpi` exist (`CheckoutPaymentMethod` type).
- Keep the price breakdown card exactly as-is structurally; only add `font-display` to the
  final total figure to match `PriceDisplay`'s `lg` treatment used elsewhere.

### 5.2 Voucher picker — `src/features/checkout/VoucherListDrawer.tsx`

Current: bottom `Drawer`, dashed-border ticket-style buttons, 🎟️ emoji badge + empty state.

Changes: swap both 🎟️ occurrences for `Ticket` (lucide) — badge icon inside the existing
`bg-white shadow-soft` circle, and the empty-state icon at `size={40}` matching the convention
used in `EmptyState` elsewhere (see `Faq.tsx`'s "No results found" state). No structural
change — the dashed-ticket card metaphor is a nice, restrained touch worth keeping.

### 5.3 Payment screens — `src/features/checkout/PaymentScreen.tsx` + `QrphPaymentScreen.tsx` + `BpiPaymentScreen.tsx`

Current: **the least-styled screens in the app** — bare centered text, no card container, no
icons, just `Spinner` + copy. This is the biggest visual gap in the whole flow.

Changes:
- Wrap the whole `PaymentScreen` content in a `rounded-card border border-border bg-surface
  shadow-soft p-6` container (matching every other content card in the app), centered in the
  page with the existing `max-w-2xl` page width.
- Title → `font-display text-xl font-bold text-text`.
- QRPh: wrap the `<img>` QR code in a bordered frame (`rounded-card border border-border p-4
  bg-white`) so it doesn't float bare on the page — **do not replace the real `<img
  src={qr_url}>`** with a generated/decorative QR graphic; the QR must stay backend-supplied.
- BPI: the "Continue to BPI" `Button` can gain a `Landmark`/`ExternalLink` icon; no other
  change needed since it's just a redirect action.
- Failure/timeout state: use `AlertCircle` (lucide) next to the existing
  `text-status-cancelled` message instead of plain text alone.

### 5.4 Order confirmation — `src/features/checkout/OrderConfirmation.tsx`

Current: animated `bg-gradient-status-delivered` circle with a hand-rolled checkmark SVG,
`text-xl font-bold` heading (no font-display), order number/total card, "Continue shopping"
button.

Changes:
- Swap the inline checkmark `<svg>` for lucide `Check` (or `CheckCircle2`), same size/position
  inside the existing `animate-scale-in` badge — keep the `bg-gradient-status-delivered`
  background as-is (it's the established semantic status gradient, not decorative excess).
- Heading → `font-display text-2xl font-bold text-text`.
- No other structural changes; this screen is already appropriately simple.

### 5.5 Orders list — `src/pages/Orders.tsx` + `src/features/orders/OrderCard.tsx`

Current: `text-lg font-bold` heading, 🧾 empty state, `OrderCard` list with
`OrderStatusBadge`.

Changes:
- Heading → `font-display text-2xl font-bold text-text`.
- Empty state icon 🧾 → `ReceiptText` (lucide), `size={40}`, matching the `EmptyState` icon
  convention used elsewhere (Cart's empty state, FAQ's no-results state).
- `OrderCard` itself needs no structural change — it already uses
  `rounded-card`/`shadow-soft`/`hover:shadow-card` correctly.

### 5.6 Order detail + tracking

**`src/features/orders/OrderDetailView.tsx`**
- Delivery address heading 📍 → `MapPin` (same swap as Checkout).
- Section headings get `font-display` treatment where they're page-level (the main order
  header), but keep card-internal sub-headings (Items, Delivery Address, etc.) as
  `font-semibold` body text — matching how Cart.tsx distinguishes its page `<h1>` from
  in-card labels.
- No change to the polling (`refetchInterval`), cancellation flow, or invoice download.

**`src/features/orders/OrderStatusTimeline.tsx`**
- Same checkmark SVG duplicated from `OrderConfirmation.tsx` → same lucide `Check` swap, so
  there's exactly one place the "completed step" icon is defined in spirit (still two
  separate components, but visually and semantically identical now).
- Keep the `bg-gradient-status-*` step-marker colors — these are the real order-status
  semantic tokens (`orderStatus.ts`'s `ORDER_STATUS_COLOR_CLASS`), not decorative.

**`src/features/orders/RiderTrackingCard.tsx`**
- 🛵 heading emoji → `Bike` (lucide).
- Inline phone SVG on the call button → `Phone` (lucide), same circular
  `bg-primary-500` button.
- **Do not add a map.** There is no map library anywhere in this codebase and no
  lat/lng-rendering component to build on — this component is genuinely text/number only
  (rider name, computed straight-line distance, "updated N min ago"). Adding a live map view
  would be a real new feature (map library dependency, API key, tile provider), not a
  restyle — flag it separately if that's actually wanted.

### 5.7 Feedback modal — `src/features/orders/FeedbackModal.tsx`

Current: `Modal` with 5 literal `★` characters as buttons, textarea, "submit anonymously"
checkbox.

Changes: swap the `★` characters for lucide `Star`, filled (`fill-accent text-accent`) when
selected, outline (`text-border`) when not — same visual language as the star ratings already
used in `Global.tsx`'s testimonial cards. Everything else stays as-is.

## 6. Guardrails — do not invent

Carried over from the rest of this restyle (see project skill §41, "Never invent
requirements"). Specific to this flow:

- **Payment methods**: only `cod`, `qrph`, `bpi` exist (`CheckoutPaymentMethod` type). Don't
  add GCash/Maya/card options just because the Figma mock shows them.
- **Order statuses**: only the seven canonical values in `orderStatus.ts`
  (`order_received`, `order_confirmed`, `preparing_items`, `out_for_delivery`, `delivered`,
  `cancelled`, `pending_payment`). Don't add new steps to the timeline.
- **Rider tracking**: text + computed distance only, no map, no live ETA field beyond that.
- **Vouchers**: whatever `listVouchers`/`validateVoucher` actually return — don't add
  decorative "expires in X hours" urgency messaging unless the API actually provides an
  expiry.
- **Recipe "Steps" content** (Paluto): no such field exists — don't add a Steps tab.

## 7. Suggested order

Smallest-blast-radius first, matching how the rest of this restyle was sequenced:
1. Orders list + empty state (low risk, presentational only)
2. Order confirmation (single small component)
3. Checkout form + voucher drawer (bigger surface, but well-isolated data flow)
4. Payment screens (biggest visual gap, but low logic risk — mostly adding a container)
5. Order detail + status timeline + rider tracking (most moving parts: polling, cancellation,
   feedback, invoice download — restyle last, and re-run the flow manually afterward: place a
   test order, watch it through each status, confirm cancel/feedback/invoice still work)
