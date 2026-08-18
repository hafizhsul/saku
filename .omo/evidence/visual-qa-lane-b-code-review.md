# Visual QA Lane B — Independent Gate Review

## Verdict

- **Result:** FAIL
- **codeQualityStatus:** BLOCK
- **recommendation:** REQUEST_CHANGES

This is a read-only review of the supplied final artifacts. The populated dashboard, add form, and all-transactions captures look visually coherent at 390 × 844, and `pnpm test` (18/18) plus `pnpm typecheck` pass. The required evidence set is nevertheless incomplete, so the requested empty/filled/dashboard-add-persisted-filter user flow cannot be approved.

## Artifact inventory and freshness

| Required state | Artifact inspected | Result |
| --- | --- | --- |
| Filled dashboard | `output/playwright/home-mobile-final.png` | Present; populated balance, categories, and recents list are visible. |
| Empty dashboard | `output/playwright/home-mobile-final-2.png` | Missing. SHA-256 is identical to `home-mobile-final.png`; it is a second copy of the filled dashboard. |
| Add form | `output/playwright/add-form-mobile-final.png` | Present; top/form controls visible, but save CTA is below the captured viewport. |
| Persisted transaction | `output/playwright/transactions-mobile-final.png` | A populated list is visible, but no interaction/refresh artifact links it to a submitted form. |
| Income filter | None | Missing. The only transaction-list capture has **Semua** selected; no capture shows **Masuk** selected and expenses excluded. |
| Route evidence | `dist/_expo/.routes.json` | Only `{ "redirects": [] }`; it contains no route or interaction trace. |

All five submitted `*-final.png` files are valid RGB PNGs at 390 × 844 and postdate the touched UI source files. No source-to-capture staleness was found. There is no ULW attempt plan, so this report uses the required fallback path.

## Findings

### CRITICAL

None.

### HIGH

1. **Required empty-dashboard state is not evidenced.**  
   Evidence: `output/playwright/home-mobile-final.png` and `output/playwright/home-mobile-final-2.png` both have SHA-256 `74a012b10d43640eaeb9a29793194d5b416a72d1cf130c79117cd9794d51283a` and both render populated data. This does not verify the empty balance/card copy, empty category breakdown, empty-state CTA, or their visual layout implemented at [app/(tabs)/index.tsx](/home/ideees/Projects/mobile/oh-my-bendahara/app/(tabs)/index.tsx:51) and [app/(tabs)/index.tsx](/home/ideees/Projects/mobile/oh-my-bendahara/app/(tabs)/index.tsx:62).  
   Required correction: provide a distinct final capture of the empty dashboard at the same viewport.

2. **The submitted final artifacts do not prove the income-filter flow.**  
   Evidence: [transactions-mobile-final.png](/home/ideees/Projects/mobile/oh-my-bendahara/output/playwright/transactions-mobile-final.png) visibly has **Semua** selected; no capture shows **Masuk** selected or only the income row retained. The route artifact is non-probative. The code has a plausible filter path at [app/(tabs)/transactions.tsx](/home/ideees/Projects/mobile/oh-my-bendahara/app/(tabs)/transactions.tsx:23), but source plausibility cannot replace UI-flow evidence.  
   Required correction: capture the settled selected-income state, including the filtered list and selected tab affordance.

3. **Persistence is asserted by a static end-state, not demonstrated by a continuous user-visible flow.**  
   Evidence: the add-form capture and populated dashboard/list captures have no step artifact, console/network/state trace, or before/after screenshots associating the newly submitted form with the added transaction. `dist/_expo/.routes.json` provides no such trace. Code indicates the intended path—[app/add-transaction.tsx](/home/ideees/Projects/mobile/oh-my-bendahara/app/add-transaction.tsx:69) calls the provider, which writes to AsyncStorage at [TransactionsProvider.tsx](/home/ideees/Projects/mobile/oh-my-bendahara/src/features/transactions/TransactionsProvider.tsx:117)—but that is not independent UI proof.  
   Required correction: supply a sequenced artifact set (filled form → saved confirmation/return → dashboard or list showing that same transaction, ideally after reload).

### MEDIUM

1. **The storage test called a “round-trip” does not round-trip.**  
   [src/storage/transactions.test.ts](/home/ideees/Projects/mobile/oh-my-bendahara/src/storage/transactions.test.ts:44) preloads `getItem` independently, then separately asserts that `saveTransactions` called the mock. It never makes a later `loadTransactions` return what the save wrote. It is not a deletion-only test, but it is partly implementation-mirroring and offers false confidence for the persistence claim. A narrow adapter/provider behavior test that routes saved bytes back through a stateful fake would be relevant.

2. **The final add-form capture does not cover the primary save control.**  
   [add-form-mobile-final.png](/home/ideees/Projects/mobile/oh-my-bendahara/output/playwright/add-form-mobile-final.png) stops within the notes field; the "Simpan transaksi" button at [app/add-transaction.tsx](/home/ideees/Projects/mobile/oh-my-bendahara/app/add-transaction.tsx:200) is outside the frame. This is not clipping—the screen is a scroll owner—but it leaves the form’s primary action, busy state, and 44 pt touch target unreviewed.

### LOW

1. **No visible clipping or contrast defect was found in the supplied viewport frames.**  
   The viewed filled dashboard, add form, transactions list, and primitive showcase have intact edges, readable labels, adequate separation, and visible text/icon semantics. This is limited to their captured scroll positions and does not cover dynamic type, focus, pressed, keyboard, or modal-transition states.

## Positive observations

- Screens use the documented token palette and coherent card/spacing anatomy; no screenshot-as-UI anti-pattern is present in the source examined.
- Visible interactive controls meet or exceed the stated 44 pt minimum: close button is 44 × 44 at [addTransactionStyles.ts](/home/ideees/Projects/mobile/oh-my-bendahara/src/features/transactions/addTransactionStyles.ts:38), primary button is 52 pt at [PrimaryButton.tsx](/home/ideees/Projects/mobile/oh-my-bendahara/src/components/PrimaryButton.tsx:47), and segmented-control container is 48 pt at [SegmentedControl.tsx](/home/ideees/Projects/mobile/oh-my-bendahara/src/components/SegmentedControl.tsx:45).
- Labels, selected states, button roles/states, and transaction accessibility labels are implemented in the reviewed component source.
- Verification run: `pnpm test` passed 4 files / 18 tests; `pnpm typecheck` passed. No lint script is configured (`package.json`).

## Skill-perspective check

- **Ran:** yes. The required `omo:remove-ai-slops` and `omo:programming` skills were loaded before judging maintainability and test relevance.
- **remove-ai-slops:** production scope reviewed contains no needless extraction/parsing or unnecessary normalization attributable to the visual flow. The test at `src/storage/transactions.test.ts:44` is weak/overfit for its “round-trip” name (MEDIUM), but no deletion-only test or test merely checking a requested removal was found.
- **programming:** production code is generally typed and avoids `any`/suppression escape hatches. The same storage test mirrors a mock call rather than an observable persistence contract (MEDIUM). No brittle prompt test, untyped escape hatch, or needless abstraction found in this review scope.

## Residual risks

- No independent screenshot exists for empty, income-filtered, validation-error, keyboard, focused, pressed, or save-success states.
- Static images cannot validate 700 ms return timing, AsyncStorage persistence across reload, or that controls receive pointer/keyboard activation on device.
- The screenshots are web-sized renders; native date-picker behavior and safe-area behavior remain unobserved.

## Blockers before approval

1. Distinct final empty-dashboard capture.
2. Final **Masuk** income-filter capture showing only income results.
3. Sequenced add → save → persisted/visible transaction evidence, including the save action/state.
