# Visual QA Lane A — FAIL

## Scope and evidence inspected

- Written design contract: `DESIGN.md` (modified 2026-08-12 21:58:50 +0700).
- Captures (each valid, fully composed 390 × 844 RGB PNG, captured after the inspected UI source):
  - `output/playwright/showcase-mobile-final.png`
  - `output/playwright/home-mobile-final-2.png`
  - `output/playwright/add-form-mobile-final.png`
  - `output/playwright/transactions-mobile-final.png`
- Reference images named by `DESIGN.md`:
  - `/home/ideees/.codex/generated_images/019ff66b-2581-7d12-88e0-4e2dad9d867b/exec-b8734ac7-5fe6-47e0-be0d-6bd973b86c37.png`
  - `/home/ideees/.codex/generated_images/019ff66b-2581-7d12-88e0-4e2dad9d867b/exec-bd088a88-2744-42fe-858c-90474baafd8e.png`
- Live implementation inspected read-only: `app/(tabs)/index.tsx`, `app/(tabs)/transactions.tsx`, `app/add-transaction.tsx`, `app/(tabs)/_layout.tsx`, `app/_layout.tsx`, `src/theme/index.ts`, and all `src/components/*` primitives plus add-form styles.
- Source scan found no `Image`, `ImageBackground`, `backgroundImage`, or raster asset use in the rendered product paths. The captures are not a screenshot/image substitute for the UI.

No Git metadata exists in this workspace, so a changed-file list and full diff were unavailable. This is an evidence limitation, not a claim that an uninspected diff passed.

## Findings

### CRITICAL

None. The application uses live React Native components and shared primitives, rather than a pasted capture or a `backgroundImage` recreation.

### HIGH

1. **[product] Save is enabled while the required nominal field is empty.** The MVP spec requires the Save button to be disabled until nominal is greater than zero (and category selected). `AddTransactionScreen` renders `PrimaryButton` without `disabled` at [app/add-transaction.tsx:199](/home/ideees/Projects/mobile/oh-my-bendahara/app/add-transaction.tsx:199), while `PrimaryButton` only disables for its explicit `disabled`, loading, or success states at [src/components/PrimaryButton.tsx:23-33](/home/ideees/Projects/mobile/oh-my-bendahara/src/components/PrimaryButton.tsx:23). This makes the initial form state unclear and non-compliant; the save action is merely rejected after activation.

2. **[product] Segmented options miss the 44 pt actionable-control minimum.** The design contract requires every action to have a 44 pt minimum target. The outer segmented group is 48 pt high, but its pressable options are explicitly `minHeight: 40` with 4 pt container inset at [src/components/SegmentedControl.tsx:45-68](/home/ideees/Projects/mobile/oh-my-bendahara/src/components/SegmentedControl.tsx:45). This affects the visible filters in `showcase-mobile-final.png` and `transactions-mobile-final.png`, and the income/expense chooser in `add-form-mobile-final.png`.

3. **[product] The documented token-only system is incomplete.** Although colors and core scales are centralized in [src/theme/index.ts](/home/ideees/Projects/mobile/oh-my-bendahara/src/theme/index.ts:1), product primitives still introduce one-off visual values instead of using those tokens: raw radius at [app/(tabs)/index.tsx:155](/home/ideees/Projects/mobile/oh-my-bendahara/app/(tabs)/index.tsx:155), raw typography weights in [src/components/StatCard.tsx:36](/home/ideees/Projects/mobile/oh-my-bendahara/src/components/StatCard.tsx:36), [src/components/TransactionRow.tsx:41](/home/ideees/Projects/mobile/oh-my-bendahara/src/components/TransactionRow.tsx:41), and [src/features/transactions/addTransactionStyles.ts:36](/home/ideees/Projects/mobile/oh-my-bendahara/src/features/transactions/addTransactionStyles.ts:36), plus raw geometric values in [src/components/BalanceCard.tsx:69-71](/home/ideees/Projects/mobile/oh-my-bendahara/src/components/BalanceCard.tsx:69) and [app/(tabs)/_layout.tsx:14-23](/home/ideees/Projects/mobile/oh-my-bendahara/app/(tabs)/_layout.tsx:14). This fails the stated requirement that colors, spacing, and typography be token-driven rather than scattered one-offs.

### MEDIUM

1. **[evidence] No same-viewport, state-matched reference image exists for a pixel comparison.** The declared dashboard targets are 853 × 1844 and 863 × 1823 images containing device chrome; the delivered captures are 390 × 844 inner-viewport screens. They cannot be objectively image-diffed without an invalid crop/scale inference. The written contract is therefore the fidelity baseline for this lane, not a pixel-perfect target.

2. **[evidence] The captures prove only resting, seeded-data states.** The add-form capture ends mid-form before the primary action; no focused keyboard state, validation error, disabled save state, selected filter change, or post-save `Tersimpan` state is evidenced. The source implements several of these paths, but the specified screenshots do not visually verify them.

### LOW

1. **[product] The first home capture reaches the beginning of a transaction row immediately above the fixed tab bar.** No overlap is visible and `ScreenShell` reserves bottom padding, but the primary CTA and complete recent-list anatomy are off-screen in `home-mobile-final-2.png`; confirm at the final intended scroll positions that the tab bar never hides actionable content.

## What passed

- Hierarchy is clear in all four captures: overline → title → main summary/action → supporting content. The balance card remains the strongest element on home/showcase.
- Spacing is consistently based on a 16 pt screen gutter and a calm, single-column scroll layout. No horizontal overflow, clipped labels, or broken card bounds are visible at 390 pt.
- Semantic use is clear: income is green with a label/icon, expense is terracotta with a label/icon, and the primary action is charcoal. The selected transaction type/category are distinguished by more than color.
- All visible form fields have labels (`Nominal`, `Kategori`, `Tanggal`, `Catatan`), and visible controls are legible. Close and primary buttons meet the documented 44/52 pt targets in source.
- Reused live primitives (`ScreenShell`, `BalanceCard`, `StatCard`, `CategoryBreakdown`, `TransactionRow`, `SegmentedControl`, `Field`, `PrimaryButton`) render the screens; no evidence of a flattened raster implementation was found.

## Recommendation

**REQUEST_CHANGES / FAIL.**

### Blockers before approval

1. Make the initial Save state disabled until all required form inputs are valid, with an unambiguous visual and accessibility state.
2. Increase each segmented-control press target to at least 44 pt.
3. Complete tokenization of product styling; remove the cited raw typography, radius, and geometric values or promote them to semantic tokens.

## Residual risks after blockers

- Recapture and inspect keyboard, validation, filter-selected, save-success, and scrolled-bottom states at the same mobile viewport.
- Produce a reference capture at the actual 390 × 844 viewport if pixel-level reference fidelity is required.
