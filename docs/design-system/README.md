# FitHub Design System

> Personal fitness tracking app — training, meals, body composition, and goals — built mobile-first for one user (the owner). The brand voice is Japanese-language, calm, and quietly confident.

---

## Sources

This design system was built by reading the production codebase. All values, components, and patterns trace back to specific source files. The reader of this doc isn't assumed to have access — everything is captured here — but for provenance:

- **Codebase:** [`gakuton/fithub`](https://github.com/gakuton/fithub) (main branch)
  - `app/globals.css` — color tokens, radii, font wiring (shadcn/Tailwind v4)
  - `app/layout.tsx` — root shell, font loading (`Geist` via `next/font/google`), `BottomNav`, `Toaster`
  - `app/(app)/page.tsx` — Home screen layout
  - `app/(app)/{history,meal,body,profile}/page.tsx` — feature pages
  - `app/icon.tsx`, `app/apple-icon.tsx`, `public/icon.svg` — logomark
  - `public/manifest.json` — PWA chrome (`theme_color: #6366f1`, `background_color: #fbfaff`)
  - `components/ui/*` — shadcn primitives (button, input, dialog, drawer, tabs, select, alert-dialog, label, sonner)
  - `components/common/BottomNav.tsx` — bottom tab bar
  - `components/{home,meal,body,exercise,history,profile,set,aerobic}/*` — feature components
- **Spec docs (referenced in `CLAUDE.md`, not in this repo):** Phase1–4 設計ドキュメント (Japanese — requirements, app spec, business layer, design docs).

---

## What FitHub is

FitHub (フィットハブ) is a single-user fitness tracker with four feature pillars:

| Tab | Path | What it does |
|-----|------|--------------|
| **ホーム** (Home) | `/` | Today's training sets, today's meals (PFC + kcal), latest body composition, profile shortcut |
| **運動** (Training) | `/history` | Per-date and per-exercise set history, 1RM chart, aerobic sessions |
| **食事** (Meals) | `/meal` | Week strip, day detail by meal type (朝/昼/夕/その他), PFC graph |
| **体組成** (Body) | `/body` | Weight / body-fat % / skeletal muscle log + chart |
| Profile | `/profile` | Demographics + goals (motivations) |

Tech stack: Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui (on `@base-ui/react`) · Drizzle + SQLite (Turso) · TanStack Query v5 · Recharts · Zod · `lucide-react` icons · `sonner` toasts · `vaul` drawers · `canvas-confetti` (goal-achieved celebration).

The product is **mobile-first** with a hard 44px minimum tap target, capped at `max-w-lg` (32rem) and centered on larger screens.

---

## File index

```
README.md                  ← you are here
SKILL.md                   ← Claude Skill manifest (cross-compat with Agent Skills)
colors_and_type.css        ← all CSS vars: color, radii, type, spacing, shadows
_source_globals.css        ← unmodified copy of the original app/globals.css
assets/
  fithub-logo.svg          ← canonical 512×512 logomark (gradient F)
  fithub-logo.png          ← rendered fallback
fonts/
  (Geist + Geist Mono are loaded from Google Fonts CDN — no local files)
preview/
  *.html                   ← design-system review cards (registered)
ui_kits/
  app/                     ← FitHub mobile app UI kit (Home, Training, Meals, Body)
    index.html
    components/*.jsx
```

---

## CONTENT FUNDAMENTALS

**Language.** Japanese-first. Almost every visible string in the app is Japanese — UI chrome, button labels, empty states. Latin numerals and a small set of English unit abbreviations (kg, kcal, g, BMI, PFC, 1RM) appear inline within Japanese sentences. There is **no English alternate** in the codebase.

**Tone.** Quiet, neutral, declarative. No exclamation marks, no marketing copy, no second-person address ("あなた" — you), no first-person ("私" — I). Strings name the data or the action and stop.

- Section labels: `今日のトレーニング`, `今日の食事`, `最新の体組成`, `今日`
- Buttons (primary action): `セットを追加`, `食事を追加`, `体組成を記録`
- Tabs: `日付別` / `種目別`, `記録` / `グラフ`
- Empty states: a short factual statement + a one-line nudge
  - `今日のトレーニングはまだありません` + `ボタンからセットを追加しましょう`
  - `体組成の記録がありません`
  - `この日の記録がありません`, `この週の記録がありません`
- Errors: `データの取得に失敗しました` + `しばらく経ってから再度お試しください`

**Casing & punctuation.** Sentence-style, no terminal punctuation on labels. Slashes use full-width `／` between PFC values (`P 80g ／ F 25g ／ C 200g`) but ASCII `/` between tab pairs (`日付別 / 種目別`). Plus signs use full-width `＋` on inline action chips (`＋ 食事を追加`). Dates render as `YYYY-MM-DD`. Year/month renders Japanese: `2026年4月`.

**Numerals.** Tabular numerals where space is tight (set tables, charts). Round-up `Math.round` for kcal and macro grams in summaries — sub-gram precision is never shown in cards.

**Units.** `kg`, `kcal`, `g`, `回` (reps), `分` (minutes), `km`, `%`. Always Latin-style with no space (`72.4kg`) when inline-bolded; otherwise a single space (`72.4 kg`). 1RM is annotated `1RM 95 kg`.

**Emoji.** None. The codebase uses zero emoji. Iconography is exclusively `lucide-react`.

**Vibe.** Read it like a notebook for one. The app is a data-capture tool, not a coach: it doesn't congratulate, doesn't streak-shame, doesn't gamify. The single exception is `canvas-confetti` on goal achievement — a ten-second visual reward, no copy.

---

## VISUAL FOUNDATIONS

### Color
- **Brand spine: hue 277** (indigo→violet). `oklch(0.585 0.233 277.117)` ≈ `#6366f1` is the primary; the logo bleeds it to `#8b5cf6` over a 135° gradient. Every neutral (background, card, border, muted, sidebar) is a desaturated shift of the same 277 hue — never gray-zero — which gives the whole app a cool-violet cast.
- **Semantic colors** are reserved for content, not chrome:
  - **Body fat %** rendered in `text-orange-500`
  - **Skeletal muscle** rendered in `text-green-500`
  - **Aerobic sessions** use `sky-500` (cyan-blue) instead of indigo, to distinguish them from strength sets at a glance
  - **Charts** use a fixed 5-color palette (indigo, cyan, green, amber, orange-red) at near-equal lightness
- **Destructive** is `oklch(0.577 0.245 27.325)` (red), used only for delete/error.
- **Dark mode** exists but isn't wired to a toggle in the shipped UI; it's the same hue at lower lightness, with primary lifted to `oklch(0.68 0.2 277)` for AA contrast on dark surfaces.

### Type
- **Geist** (sans) for everything; **Geist Mono** declared but rarely used in the live UI.
- Japanese fallback chain: `Hiragino Sans → Hiragino Kaku Gothic ProN → Yu Gothic UI → Yu Gothic → Noto Sans JP`.
- Page titles: `text-2xl font-bold tracking-tight` (24px / 700 / -0.02em). Section labels: `text-sm font-semibold text-muted-foreground` (14px / 600 / muted). Body rows: `text-sm`. Helper/meta: `text-xs`. Big readouts (weight, kcal): `text-2xl font-bold` with a small muted unit immediately after.
- Hierarchy is achieved with **weight + color**, not size. A typical card has only two sizes inside it: 14 and 12.

### Spacing & layout
- Tailwind base unit (0.25rem). Common gaps: `gap-1.5/2/3` (inline), section spacing `mb-4/5/6`, page padding `px-4 pt-6`.
- Page width capped at `max-w-lg` (32rem ≈ 512px) and centered. Below that, the app is full-bleed inside a 16px gutter.
- Bottom nav reserves `pb-20` on the page main so content never hides under it.
- Hit targets: `min-h-[44px] min-w-[44px]` everywhere — list rows, buttons, tab triggers, week-strip days.

### Backgrounds & imagery
- **No imagery, no illustrations, no patterns.** The product is data + chrome. Backgrounds are flat token surfaces (`--background`, `--card`, `--muted`).
- The only gradient in the entire system is the **logomark** (`linear-gradient(135deg, #6366f1, #8b5cf6)`).
- No full-bleed photography. No texture. No grain. No blur except a single `backdrop-blur-sm` on the bottom nav (`bg-card/95 backdrop-blur-sm`) so content scrolls behind it cleanly.

### Borders & corners
- Borders are 1px, color `--border` (light cool-violet). Used liberally on cards, list rows (`divide-y`), inputs, tab containers.
- Corner radius is `0.75rem` base, but **rounded-2xl (`var(--radius-2xl)` ≈ 21.6px) is the dominant card radius** in the home feed. Inputs, buttons, dialogs, segmented tabs use `rounded-lg` / `rounded-xl`. Day pills in the week strip and tab segments use `rounded-md`.

### Shadows & elevation
- **Restrained.** `shadow-sm` on a few cards (meal summary, week strip), nothing heavier. The nav has no shadow — only a top border. Dialogs use `ring-1 ring-foreground/10` instead of a drop shadow. There is no inner shadow anywhere.
- The "active tab pill" effect is `bg-background` on top of `bg-muted` with `shadow-sm` to lift the selected segment.

### Buttons & interactive states
- **Variants** (from `components/ui/button.tsx`): `default` (filled primary), `outline` (bordered, neutral hover), `secondary`, `ghost`, `destructive` (10% destructive bg, full-color text), `link`. Sizes: `xs/sm/default/lg/icon` + icon variants. Default height 32px (`h-8`); `lg` 36px.
- **Hover (mouse).** `hover:bg-primary/80` for filled; `hover:bg-muted` for outline/ghost. Outline ghost uses `hover:text-foreground`. **Critically, hover is never relied on as a sole signal** — the app is mobile-first.
- **Press / active.** `active:not(...)translate-y-px` — the button drops 1px on press (subtle haptic-like feedback). Inline pill buttons use `active:opacity-70`. List rows: `active:bg-muted/50`.
- **Focus.** `focus-visible:ring-3 focus-visible:ring-ring/50` + `focus-visible:border-ring` — a 3px ring at 50% primary opacity. No outline.
- **Disabled.** `disabled:opacity-50 disabled:pointer-events-none`. Errors invert to `aria-invalid:border-destructive aria-invalid:ring-destructive/20`.

### Animation
- All meaningful transitions are `transition-colors` or `transition-opacity`, durations default (~150ms), no custom easing.
- Skeleton loaders use Tailwind's `animate-pulse` with muted-bar placeholders.
- Dialogs: `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` / corresponding `data-closed`. Duration 100ms.
- Drawers (`vaul`) slide up from bottom on mobile.
- **`canvas-confetti`** fires on goal-achieved (`MotivationSection`) — the only "celebratory" animation in the system.
- No bounces, no springs, no parallax, no on-scroll animations.

### Transparency & blur
- Used twice and only twice: bottom nav (`bg-card/95 backdrop-blur-sm`) and dialog backdrop (`bg-black/10 supports-backdrop-filter:backdrop-blur-xs`).
- Soft tint colors (`bg-primary/5`, `bg-primary/10`, `bg-primary/15`, `bg-sky-500/15`) are used for badge fills and section header strips. These are tints over white, not blurs.

### Cards
- Default card: `rounded-2xl border bg-card overflow-hidden` (no shadow). Section sub-headers inside use `bg-primary/5` with a subtle bottom border, plus a pill badge `rounded-full bg-primary/15 text-primary`.
- Summary cards: `rounded-xl border bg-card p-4 shadow-sm`.
- List rows inside cards: `divide-y` separator + per-row `min-h-[44px]` + `hover:bg-muted/30 active:bg-muted/50`.

### Layout rules (fixed elements)
- One fixed element exists: `<BottomNav>`, `fixed bottom-0 inset-x-0 z-50` with a top border. Everything else scrolls.
- Drawers and dialogs are portaled and centered. Modals max-width `sm:max-w-sm`.

### Imagery vibe
- N/A — there is no imagery in the product. The user-facing data is numbers, dates, and short Japanese labels.

---

## ICONOGRAPHY

**System.** [`lucide-react`](https://lucide.dev) v1.x is the icon set. Every icon in the shipped UI is a Lucide component imported by name — no SVG sprite, no icon font, no PNGs.

**Icons in use** (full list, from a code grep):
- Navigation: `Home`, `Dumbbell`, `UtensilsCrossed`, `Scale` (bottom tabs)
- Profile: `UserCircle`
- Actions: `Download`, `XIcon` (dialog close), `ChevronLeft`, `ChevronRight`
- Status: `AlertCircle` (error empty state)

**Stroke / sizing.** Default Lucide stroke is 1.8 (very thin, near-hairline). Active-state nav icons bump to **2.5 stroke-width**. Standard inline size is **16px** next to text, **18–20px** for nav, **24–26px** for hero positions (e.g. `UserCircle` at 26).

**Color.** Icons inherit `currentColor` and follow the tokens — `text-muted-foreground` when inactive, `text-primary` when active or accenting. Destructive icons use `text-destructive`. **Never** colored inline; always tied to a token.

**Logo.** A wordmark-less monogram: a white "F" centered in a 512×512 rounded-rect (96px corner radius) filled with the brand gradient. Two flavors live in the app:
- `app/icon.tsx` — 32×32 PWA icon, rounded 7px
- `app/apple-icon.tsx` — 180×180 home-screen icon, no rounding (iOS rounds it)
- `public/icon.svg` — the canonical asset (copied here as `assets/fithub-logo.svg`)

In-app, the logo appears small (h-9 w-9, `rounded-xl`) at the start of the home header alongside the wordmark "FitHub" set in `text-2xl font-bold tracking-tight`.

**Emoji.** None. **Unicode glyphs.** Two: `＋` (full-width plus) on inline action chips, and `／` (full-width slash) as a PFC separator. Otherwise none.

---

## How to use this system

1. Read `colors_and_type.css` — that's the floor. All colors live there in oklch; all type tokens, radii, spacing, and shadows live there too.
2. Open the **Design System** tab in the project review pane to see every token, component, and screen registered as a card.
3. For a full app mockup, open `ui_kits/app/index.html`. The `.jsx` files inside are small, copy-pastable component recreations of the live app.
4. When extending: stay on hue 277 for chrome; reach for chart-2…5 only for content; resist adding shadow, gradient, or imagery.

— Last updated 2026-04-26
