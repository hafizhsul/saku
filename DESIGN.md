# Saku Design System

## 0. Research Log

- Embedded refs: shortlisted Notion, Wise, and Expo; picked `minimalist-skill` + `expo.md` because their calm whitespace, two-surface light system, crisp hierarchy, and rounded action geometry fit an offline personal finance journal. Finance semantics are adapted from the product brief rather than copied from either reference.
- Lazyweb: 3 mobile queries (`personal finance mobile dashboard`, `expense tracker transactions mobile`, `budget app add transaction mobile`), 3 screens viewed; retained the single-focus dashboard, period/filter controls, scan-friendly transaction rows, and reachable bottom action grammar.
- Imagen drafts: `/home/ideees/.codex/generated_images/019ff66b-2581-7d12-88e0-4e2dad9d867b/exec-b8734ac7-5fe6-47e0-be0d-6bd973b86c37.png` and `/home/ideees/.codex/generated_images/019ff66b-2581-7d12-88e0-4e2dad9d867b/exec-bd088a88-2744-42fe-858c-90474baafd8e.png`; picked the first as the reference-fidelity contract for the dashboard because its category breakdown and recent transaction anatomy match the approved MVP. The line trend from the second draft is intentionally out of scope.
- UI/UX DB: ran a design-system lookup plus React Native, UX, and color queries for a calm personal-finance app; retained the 44 pt touch minimum, visible form labels, meaningful empty states, semantic color tokens, and reduced-motion guidance.
- Skipped lanes: none.

## 1. Atmosphere & Identity

Saku feels like a quiet money journal on a tidy desk: tactile enough to feel personal, structured enough to build trust, and calm enough to invite a quick entry after a busy day. The name plays on the Indonesian habit of keeping everyday money in a pocket (saku) — a small, personal place where income is counted and spending is set aside per category. The signature is a matte bone canvas with one strong balance card, charcoal typography, and restrained green/terracotta marks that carry financial meaning rather than decoration.

The product is cross-platform neutral. It borrows Expo's airy surface contrast and friendly rounded controls, then warms the canvas and keeps the hierarchy specific to personal finance. The interface is light-only in the MVP; dark tokens are reserved for a later theme without being exposed in the product flow.

## 2. Color

### Palette

| Role | Token | Light | Dark reserve | Usage |
|------|-------|-------|--------------|-------|
| Canvas | `colors.canvas` | `#F7F6F3` | `#171918` | Root screen background |
| Surface | `colors.surface` | `#FFFEFC` | `#222624` | Cards, rows, form groups |
| Surface muted | `colors.surfaceMuted` | `#F1F0EC` | `#2B302D` | Secondary areas, icon wells |
| Surface elevated | `colors.surfaceElevated` | `#FFFFFF` | `#2A2D2B` | Modal and primary controls |
| Text primary | `colors.textPrimary` | `#2F3437` | `#F7F6F3` | Headings, amounts, labels |
| Text secondary | `colors.textSecondary` | `#60646C` | `#C7CCC8` | Supporting copy and metadata |
| Text tertiary | `colors.textTertiary` | `#7C817E` | `#9BA39E` | De-emphasized metadata |
| Border | `colors.border` | `#E6E3DD` | `#3B423E` | Cards, fields, separators |
| Border strong | `colors.borderStrong` | `#D3D0C8` | `#4D554F` | Focused or selected containers |
| Action | `colors.action` | `#2F3437` | `#F7F6F3` | Primary CTA background |
| Action pressed | `colors.actionPressed` | `#1F2426` | `#FFFFFF` | Pressed CTA state |
| Income | `colors.income` | `#346538` | `#9BCD94` | Pemasukan and positive balance |
| Income surface | `colors.incomeSurface` | `#EDF3EC` | `#263A2A` | Income icon wells and selected state |
| Expense | `colors.expense` | `#9F2F2D` | `#F2A7A2` | Pengeluaran and negative values |
| Expense surface | `colors.expenseSurface` | `#FDEBEC` | `#432827` | Expense icon wells and selected state |
| Accent | `colors.accent` | `#956400` | `#F5C86C` | Small positive emphasis, never the main CTA |
| Accent surface | `colors.accentSurface` | `#FBF3DB` | `#453D24` | Small callouts and category wells |
| Focus | `colors.focus` | `#2547D0` | `#9FB3FF` | Keyboard and accessibility focus |
| Error | `colors.error` | `#A12723` | `#FFB4AE` | Field errors and storage failure |

### Rules

- Colors are semantic tokens only; screens do not introduce raw hex values.
- Green and terracotta always pair with a text label or directional icon. Color is never the sole carrier of meaning.
- The main action is charcoal, not green, so “add transaction” remains a neutral product action.
- The light theme uses charcoal text on bone/white surfaces for a minimum AA contrast target.
- Dark reserve values are documented for future use but are not wired into the MVP theme switch.

## 3. Typography

### Scale

React Native uses the platform system sans. This keeps the app readable and avoids a network-dependent font load. The `fontWeight` values below are the only weight variants used.

| Level | Size | Weight | Line height | Usage |
|-------|------|--------|-------------|-------|
| Display | 40 | 800 | 46 | Primary balance amount |
| Title | 28 | 700 | 34 | Screen title and brand wordmark |
| Heading | 20 | 700 | 26 | Section headings and card titles |
| Body large | 18 | 400 | 26 | Primary form values and lead copy |
| Body | 16 | 400 | 24 | Default copy and transaction names |
| Body medium | 14 | 600 | 20 | Supporting labels and category names |
| Caption | 12 | 500 | 16 | Dates, helper text, filter labels |
| Overline | 11 | 700 | 14 | Uppercase section context, used sparingly |

### Rules

- Body text never drops below 14 on a normal content path.
- Amounts use `fontVariant: ["tabular-nums"]` where supported so values do not jump as they update.
- Indonesian copy is short and concrete. Avoid promotional filler and avoid forcing a display heading across more than three lines on a small phone.
- Do not use emoji as iconography or decorative copy.

## 4. Spacing & Layout

### Base unit

All layout values derive from a 4 pt base unit.

| Token | Value | Usage |
|-------|-------|-------|
| `spacing.xs` | 4 | Icon-to-label and tight alignment |
| `spacing.sm` | 8 | Compact groups and chip gaps |
| `spacing.md` | 12 | Field inner padding and small section gaps |
| `spacing.lg` | 16 | Standard page gutter and card rows |
| `spacing.xl` | 20 | Comfortable card inner padding |
| `spacing.2xl` | 24 | Primary card padding and section gaps |
| `spacing.3xl` | 32 | Major group separation |
| `spacing.4xl` | 40 | Top-level screen breathing room |
| `spacing.5xl` | 48 | Modal and balance card spacing |

Semantic aliases for the vertical rhythm. `gap` uses these; padding/margin keeps the numeric tokens above.

| Alias | Value | Usage |
|-------|-------|-------|
| `spacing.unit` | 4 | Icon-to-text, tight alignment |
| `spacing.compact` | 8 | Chips, label-to-input, icon-to-label |
| `spacing.row` | 12 | List rows, card pairs, form actions |
| `spacing.group` | 16 | Card groups, inner-card gaps |
| `spacing.section` | 20 | Main screen block separation, page gutter |

### Layout rules

- Default horizontal page gutter: `spacing.lg`; use `spacing.xl` on wider tablets.
- Main screens are single-column and scroll vertically. No horizontal scroll or nested horizontal navigation is required for MVP.
- The balance card gets the strongest visual space; secondary cards and category bars stay subordinate.
- Content above a bottom tab bar reserves enough bottom padding for the bar and safe-area inset.
- At widths above 640, the home content may widen to a centered column with a maximum readable width of 720; it does not become a dense desktop dashboard.
- Form fields and controls maintain at least 44 pt height. Icon-only actions use `hitSlop` when their visible glyph is smaller.

### Radii

| Token | Value | Usage |
|-------|-------|-------|
| `radius.sm` | 8 | Icon wells and compact fields |
| `radius.md` | 12 | Inputs, segmented controls, primary buttons |
| `radius.lg` | 16 | Stat cards and secondary panels |
| `radius.xl` | 20 | Balance card and modal sheet |
| `radius.pill` | 999 | Small category/filter chips only |

Large cards and primary buttons never use pill geometry. Pills are reserved for compact filters or tags.

## 5. Components

### ScreenShell

- **Structure**: Safe-area-aware root with a scroll owner and consistent page gutter.
- **Variants**: default, modal.
- **Spacing**: `spacing.lg` gutter, `spacing.3xl` section separation, `spacing.5xl` bottom reserve when tab bar is visible.
- **States**: default, loading, error, empty.
- **Accessibility**: exposes an ordered content tree; loading and error messages are announced as status text.
- **Motion**: screen content may fade/translate in once; no looping motion.
- **Layout**: single-column shell; `ScrollView` owns vertical scrolling.

### BalanceCard

- **Structure**: label, large balance amount, supporting month/context line, optional small status note.
- **Variants**: positive, neutral, negative, empty.
- **Spacing**: `spacing.2xl` padding, `radius.xl` surface.
- **States**: default, pressed when tappable, loading, empty, error.
- **Accessibility**: announces label and formatted balance as one meaningful value.
- **Motion**: amount updates may crossfade; no layout animation.
- **Layout**: full-width primary content block.

### StatCard

- **Structure**: semantic icon well, label, formatted amount, period caption.
- **Variants**: income, expense.
- **Spacing**: `spacing.lg` padding, `radius.lg` surface.
- **States**: default, pressed when tappable, loading, empty.
- **Accessibility**: includes the semantic label in the accessible name; color is supplementary.
- **Motion**: 150 ms opacity/scale press feedback.
- **Layout**: two-column stat strip that stacks at very narrow widths.

### CategoryBreakdown

- **Structure**: section heading, category rows with icon well, label, horizontal progress bar, value, percentage.
- **Variants**: populated, empty.
- **Spacing**: `spacing.md` row gap, `spacing.sm` icon-to-label gap.
- **States**: default, loading, empty.
- **Accessibility**: each row exposes category, amount, and percentage in one label; progress is not color-only.
- **Motion**: progress bars appear at their final width; no decorative chart animation.
- **Layout**: full-width list inside the primary scroll owner.

### TransactionRow

- **Structure**: category icon well, name plus category/date, right-aligned signed amount.
- **Variants**: income, expense, compact.
- **Spacing**: `spacing.md` vertical padding, `spacing.sm` internal gap.
- **States**: default, pressed, loading placeholder, empty list.
- **Accessibility**: row label includes name, type, category, date, and formatted amount.
- **Motion**: 150 ms pressed opacity without moving siblings.
- **Layout**: list item with a separator; parent `FlatList` or `ScrollView` owns scrolling.

### SegmentedControl

- **Structure**: two or three labeled pressable options in a bordered group.
- **Variants**: transaction type, list filter.
- **Spacing**: `spacing.xs` inner inset, `spacing.sm` label padding.
- **States**: default, selected, pressed, disabled, focus.
- **Accessibility**: selected option exposes `accessibilityState={{ selected: true }}`.
- **Motion**: 150 ms opacity/color transition; no width animation.
- **Layout**: inline cluster that wraps only if the available width requires it.

### PrimaryButton

- **Structure**: optional icon plus text label inside a full-width pressable.
- **Variants**: enabled, pressed, disabled, loading, success.
- **Spacing**: `spacing.lg` horizontal padding, 52 pt minimum height, `radius.md`.
- **States**: default, pressed, disabled, loading, success, error.
- **Accessibility**: role button, descriptive label, disabled and busy states announced.
- **Motion**: 150 ms opacity/scale press feedback; success replaces the label without moving layout.
- **Layout**: full-width primary action in the add form and home call-to-action.

### Field

- **Structure**: visible label, native input or date trigger, helper/error text.
- **Variants**: amount, note, date.
- **Spacing**: `spacing.sm` label gap, `spacing.md` inner padding, `radius.md`.
- **States**: default, focus, filled, disabled, error.
- **Accessibility**: label and hint connect to the input; errors are adjacent and announced.
- **Motion**: focus ring changes opacity/color only.
- **Layout**: vertical form stack.

### EmptyState

- **Structure**: quiet vector mark, title, one-sentence guidance, one primary action.
- **Variants**: no transactions, no filtered results, storage error.
- **Spacing**: `spacing.3xl` vertical padding, `spacing.lg` internal gaps.
- **States**: empty, error, retrying.
- **Accessibility**: title and guidance are read before the action.
- **Motion**: none beyond optional one-time fade.
- **Layout**: centered within the available scroll content.

## 6. Motion & Interaction

### Timing tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `motion.micro` | 150 ms | ease-out | Pressed state, focus state |
| `motion.standard` | 250 ms | ease-in-out | Modal open, filter switch |
| `motion.emphasis` | 400 ms | cubic-bezier-like native ease-out | First content reveal only |

Motion is functional: it confirms a press, preserves spatial context for the add modal, or clarifies a state change. No element loops or animates for decoration. The implementation uses native `Animated` or `Pressable` feedback and respects reduced-motion settings where the platform exposes them.

Signature interaction: pressing “Simpan transaksi” briefly changes the primary button into a confirmed “Tersimpan” state before returning to the originating screen. The balance card then updates immediately.

## 7. Depth & Surface

Strategy: `mixed`, led by tonal contrast and hairline borders, with whisper-soft elevation only for the primary card and modal.

| Level | Treatment | Usage |
|-------|-----------|-------|
| Flat | Canvas `colors.canvas` | Root background |
| Surface | `colors.surface` + `colors.border` | Cards, rows, fields |
| Elevated | White surface + `shadowOpacity: 0.04`, `elevation: 1` | Balance card and modal |
| Pressed | Action color shift + opacity | Pressable feedback |

No gradients, glassmorphism, heavy shadows, or decorative background blobs. Surface contrast carries most of the depth.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA contrast for content text: 4.5:1 normal text and 3:1 large text.
- All actionable controls have a 44 pt minimum hit area; icon-only controls use `hitSlop`.
- All form fields have visible labels, appropriate keyboard types, helper/error copy, and a clear recovery path.
- All semantic colors have text or icon reinforcement; no status is conveyed by color alone.
- Safe-area insets protect the header, tab bar, modal actions, and keyboard-facing fields.
- Dynamic text size must wrap without clipping the primary action or amount; content can scroll.
- Reduced-motion settings remove non-essential entrance motion.
- Screen-reader labels describe the full meaning of balance, transaction, filter, and save controls.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Runtime dark mode is not exposed | `src/theme/index.ts` | MVP scope is a light offline journal; dark reserve tokens are documented for a later theme pass. | Add a user/system theme switch in a future settings scope. |
| AsyncStorage failure cannot be simulated reliably in the UI smoke path | `src/storage/transactions.ts` | The boundary is guarded and the user-facing error state is implemented; device-level storage fault injection is not part of MVP QA. | Add an injected storage adapter in a future resilience test pass. |

