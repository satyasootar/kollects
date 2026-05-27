# Implementation Plan

## Overview

This plan implements the Form Builder UX Flow Fix using the bug condition methodology. The eleven defects (1.1 – 1.11) in the three-step Create → Design → Preview authoring flow share a single root cause — the steps were implemented as independent React pages with no shared persistence boundary and no consistent DB hydration on mount. The fix is a coordinated rewrite of the four flow pages plus the editor layout, with additive use of existing `forms.coverImageUrl`, `forms.themeId`, and `forms.settings` jsonb columns and no schema migration.

The plan follows the exploratory bugfix workflow:

1. **Explore** — write a property-based test that surfaces counterexamples for all eleven defects on UNFIXED code.
2. **Preserve** — observe out-of-flow behavior on UNFIXED code, then encode it as property-based tests that PASS on UNFIXED code.
3. **Implement** — apply the fix across the dashboard "Create form" handler, the editor layout, the three flow pages, the form-editor store, a new theme-designer store, and an additive widening of `updateFormSchema`.
4. **Validate** — re-run both property tests; the exploration test must now PASS (bug fixed) and the preservation tests must still PASS (no regressions).

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Write the bug-condition exploration test on UNFIXED code; expect it to FAIL."
    },
    {
      "wave": 2,
      "tasks": ["2"],
      "description": "Observe out-of-flow behavior on UNFIXED code and write preservation property tests; expect them to PASS."
    },
    {
      "wave": 3,
      "tasks": ["3.1"],
      "description": "Widen updateFormSchema additively (themeId, settings.themeConfig, settings.logoUrl) so Step 2 persistence has a path."
    },
    {
      "wave": 4,
      "tasks": ["3.2", "3.3", "3.4", "3.6"],
      "description": "Independent UI rewrites: dashboard scaffold mutation, stepper relabel, Step 1 Save & Continue + reorder fix, Step 3 multi-device preview."
    },
    {
      "wave": 5,
      "tasks": ["3.5", "3.7"],
      "description": "Step 2 customizer + upload + Save & Continue (depends on 3.1 schema widening) and Step 3 on-screen Save Draft / Publish (depends on 3.6 page rewrite)."
    },
    {
      "wave": 6,
      "tasks": ["3.8", "3.9"],
      "description": "Re-run the exploration test (must now PASS) and preservation tests (must still PASS) against the fixed code."
    },
    {
      "wave": 7,
      "tasks": ["4"],
      "description": "Checkpoint — confirm all tests pass and end-to-end create / edit / refresh / out-of-flow behaviors hold."
    }
  ]
}
```

## Tasks

- [-] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Three-Step Flow End-to-End Defects
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior from the design's `expectedBehavior` specification — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate each of the eleven defects (1.1 – 1.11) in the three-step Create → Design → Preview flow
  - **Scoped PBT Approach**: For deterministic UI bugs, scope each property to the concrete failing case so failures are reproducible. Drive the flow with Playwright (or React Testing Library with mocked tRPC) and assert each symptom one-to-one against the eleven numbered defects.
  - Test implementation details from Bug Condition (`isBugCondition` in design):
    - **1.1 Entry detour**: From `/dashboard`, click "Create form"; assert the resulting URL is `/dashboard/forms/{uuid}/fields`, NOT `/dashboard/forms/new`.
    - **1.2 Silent auto-save / missing Save & Continue**: Open Step 1 with auto-save enabled, edit a field, wait 11s without saving; assert no `form.update` / `field.update` mutations were called. Also assert a button labeled "Save & Continue" exists in the DOM.
    - **1.3 Reorder drift**: Add two new fields, drag them above an existing field, save, reload; assert on-screen order matches persisted `pageNumber`/`orderIndex` for every field including the just-created ones.
    - **1.4 Hard-coded preview**: Build a single field labeled "Favorite color?" in Step 1, navigate to Step 2; assert the live preview's first label is "Favorite color?", not "Your name".
    - **1.5 Customizer no-op**: Change accent color to `#ff0000` in Step 2; within 100ms assert the live preview's submit button has `background: #ff0000`. Click "Apply Custom Theme"/"Save & Continue", reload; assert the customizer still reports `#ff0000`.
    - **1.6 Banner upload non-functional**: Click the Header tab dropzone, select a 100KB PNG; assert a `POST /api/upload` is observed and the live preview renders an `<img>` with the returned URL.
    - **1.7 Slug-gated Step 3**: Open Step 3 on a fresh form with no slug; assert preview frames are present (NOT the "Set a slug in Settings" empty state).
    - **1.8 Single-device + no on-screen Publish**: On Step 3, count rendered device frames and assert ≥ 3 frames at fixed widths (1280 / 768 / 375). Also assert a "Publish" button is rendered inside the Preview content area, not only on the layout top bar.
    - **1.9 State reset on refresh**: On Step 2 change colors/fonts and upload a banner, click Save & Continue, hit browser refresh; assert all values are preserved in the customizer.
    - **1.10 Edit case loads defaults**: Pre-seed a form with `themeId = "marvel.spiderman"` and `settings.themeConfig = { colors: { accent: "#ff0000" }, ... }`, open Step 2; assert the customizer shows the saved accent.
    - **1.11 Stepper labeling**: Render the editor layout; assert step labels are "Editor", "Design", "Preview" in that order, and that visiting `/settings` does not light up any step.
  - The test assertions match the Expected Behavior properties (2.1 – 2.13) from `bugfix.md` and the `Property 1: Bug Condition — Three-Step Flow Behaves End-to-End` clause in design.md
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found for each of the eleven defects (e.g. "click 'Create form' → URL is `/dashboard/forms/new` instead of `/dashboard/forms/{uuid}/fields`", "after `addField` × 2 + drag + save, persisted `pageNumber` of new fields drifts past existing fields", "ThemeLivePreview renders 'Your name / Email address / Message' regardless of `formData.fields`")
  - Mark task complete when test is written, run, and failures are documented for all eleven sub-cases
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

- [~] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Out-of-Flow Surfaces Unchanged
  - **IMPORTANT**: Follow observation-first methodology — capture actual behavior of the unfixed system, then encode it as properties
  - Observation step (run on UNFIXED code, record outputs):
    - Render the dashboard form list with random `(title, description, status, coverImageUrl, totalViews, totalStarts, totalSubmissions)` fixtures and snapshot each row's HTML, status filter chips, stats row, and plan-limit warning.
    - For forms with random `(themeId, fields, slug)`, request `/f/{slug}` and snapshot the rendered HTML; submit a response and snapshot the resulting `form.submit` payload, `totalViews` / `totalStarts` / `totalSubmissions` counters, and any email notification triggers.
    - Drive each out-of-flow form-management action (Duplicate, Archive, Unarchive, Delete, Share, Unpublish) from both the layout top bar and the dashboard context menu; snapshot confirmation dialogs and resulting DB transitions.
    - Open `/settings`, `/email-settings`, `/analytics`, `/responses` for a randomized form; snapshot each tab's rendered HTML including the cover-image input on `/settings` and the response list on `/responses`.
    - For each starting `status` × each transition (`publish`, `unpublish`, `archive`), snapshot the resulting `form.status`, `publishedAt`, `archivedAt`, share modal state, and `/f/{slug}` reachability.
    - Snapshot the schema column lists for `forms`, `form_fields`, `themes`, and the contents of `packages/database/migrations`.
  - Write property-based tests (using fast-check or equivalent) capturing the observed patterns from the Preservation Requirements section of the design:
    - **Dashboard list invariance**: ∀ form fixtures, the rendered dashboard row matches the pre-fix snapshot (including cover strip rules, status filter chips, stats row, plan-limit warning).
    - **Public respondent route invariance**: ∀ `(themeId, fields, slug)`, `/f/{slug}` rendering equals the pre-fix snapshot AND `form.submit` records a response with identical shape and identical analytics counter increments.
    - **Out-of-flow management actions invariance**: ∀ (form fixture, action ∈ {clone, archive, unarchive, delete, share, unpublish}, surface ∈ {top bar, context menu}), confirmation dialogs and DB transitions match the pre-fix snapshot.
    - **Sibling tab invariance**: ∀ form fixtures, `/settings` / `/email-settings` / `/analytics` / `/responses` render equal to the pre-fix snapshot.
    - **Status transition invariance**: ∀ (starting status, transition), the resulting `(status, publishedAt, archivedAt)` tuple, share modal state, and `/f/{slug}` reachability match the pre-fix snapshot.
    - **Schema invariance**: No new migration files appear under `packages/database/migrations` and the column lists of `forms`, `form_fields`, `themes` are unchanged.
    - **Non-form-builder feature invariance**: API key, template, and account-settings flows produce identical observable outputs to the pre-fix snapshot.
  - Property-based testing is recommended here because the non-bug input space is large (every dashboard interaction, every respondent flow, every sibling tab, every form-management action) and PBT generates many cases automatically and catches edge cases hand-written tests miss
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 3. Fix for broken three-step Create → Design → Preview form-builder flow

  - [~] 3.1 Widen `updateFormSchema` to accept theme persistence fields (additive, no migration)
    - In `packages/database/schemas/form.ts`, add `themeId: z.string().uuid().optional()` to `updateFormSchema` so Step 2 Save & Continue can persist a theme switch via `form.update` (the underlying `formService.update` already accepts `themeId`).
    - Extend the existing `settings` zod object on `updateFormSchema` with optional `themeConfig` (colors / fonts / shape) and `logoUrl: z.string().url().optional()`. The `forms.settings` jsonb column needs no migration.
    - Verify no other consumers of `updateFormSchema` regress (this is a non-breaking widening — all new fields are `.optional()`).
    - _Bug_Condition: 1.5, 1.6, 1.10 (no persistence path exists for theme overrides, banner URL, logo URL, or theme switches via `form.update`)_
    - _Expected_Behavior: 2.6, 2.7, 2.11, 2.12 (Save & Continue persists theme + banner + logo; refresh and edit-case re-entry hydrate from these persisted fields)_
    - _Preservation: 3.8 (additive use of existing `forms.coverImageUrl`, `forms.themeId`, `forms.settings` jsonb — no schema migration introduced)_
    - _Requirements: 2.6, 2.7, 2.11, 2.12, 3.8_

  - [~] 3.2 Replace dashboard "Create form" link with a scaffold-draft mutation
    - In `apps/web/app/(dashboard)/dashboard/page.tsx`, replace the `<Link href="/dashboard/forms/new">` with a button wired to `trpc.form.create.useMutation({ onSuccess: data => router.push(`/dashboard/forms/${data.id}/fields`) })`.
    - Submit `{ title: "Untitled form" }` (or the localized default) on click; show a small spinner on the button while the mutation is pending.
    - Delete `apps/web/app/(dashboard)/dashboard/forms/new/page.tsx` or convert it to a server-side redirect to `/dashboard` so any stale links continue to work.
    - Remove any other internal links pointing at `/dashboard/forms/new`.
    - _Bug_Condition: 1.1 (entry point detours through a title-commit page)_
    - _Expected_Behavior: 2.1 (clicking "Create form" routes directly to Step 1 under a stable formId)_
    - _Preservation: 3.1, 3.3 (dashboard list and form-management actions like Duplicate / Archive / Delete continue unchanged)_
    - _Requirements: 2.1, 3.1, 3.3_

  - [~] 3.3 Relabel and tighten the form-editor stepper to Editor → Design → Preview
    - In `apps/web/app/(dashboard)/dashboard/forms/[formId]/layout.tsx`, replace the `STEPS` definition with `[{ id: "editor", label: "Editor", path: "/fields" }, { id: "design", label: "Design", path: "/theme" }, { id: "preview", label: "Preview", path: "/preview" }]`.
    - Tighten the active-step computation: a step is active iff `pathname === basePath` or `pathname.startsWith(`${basePath}${step.path}`)`. `/settings` falls through and lights up no step.
    - Ensure clicking a step navigates to that step using the same `formId` (state preservation handled by 3.4 and 3.5 stores).
    - Keep the existing "leave with unsaved changes" guard on the layout for cross-tab navigation.
    - The global Publish button on the layout top bar may stay as a convenience for sibling tabs; the on-screen Step 3 Publish is added in 3.7.
    - _Bug_Condition: 1.11 (stepper "Build" label conflates `/fields` and `/settings`; mismatches Editor → Design → Preview model)_
    - _Expected_Behavior: 2.13 (visible Editor → Design → Preview indicator with the active step clearly marked; clicking a step navigates with the same formId)_
    - _Preservation: 3.4 (Settings, Email Settings, Analytics, Responses tabs continue to load and operate identically)_
    - _Requirements: 2.13, 3.4_

  - [~] 3.4 Rewrite Step 1 (Fields page) with explicit Save & Continue, no auto-save, and reorder-drift fix
    - In `apps/web/lib/stores/form-editor-store.ts`:
      - Remove the `autoSaveEnabled` toggle and any debounced auto-save effect.
      - Add `deletedFieldIds: string[]` (tracked by the `deleteField` action when the deleted ID is non-temp).
      - Add a `lastSyncedFields` snapshot used to diff updates on save.
      - Add an `applyCreatedIds(tempToRealId: Map<string, string>)` action that rewrites each temp field id to its real id in place (so subsequent saves see real IDs).
      - Defensive: reset the store when `formId` changes on mount.
    - In `apps/web/app/(dashboard)/dashboard/forms/[formId]/fields/page.tsx`:
      - Replace the toolbar's "Save Draft" + "Publish" + auto-save toggle with a single primary "Save & Continue" button plus a secondary "Discard changes" link. Remove the 10s debounce `useEffect`.
      - Rewrite `handleSave` as a full-sync routine:
        1. For each `temp_*` field, call `field.create`; collect `tempToRealId: Map<string, string>` from the results.
        2. For each non-temp field whose body diverges from `lastSyncedFields`, call `field.update`.
        3. For each id in `deletedFieldIds`, call `field.delete`.
        4. Compute `finalOrderIds = store.fields.map(f => f.id.startsWith("temp_") ? tempToRealId.get(f.id)! : f.id)` and defensively filter any unresolved temp IDs.
        5. Call `field.reorder.mutate({ formId, fieldIds: finalOrderIds })`.
        6. Call `form.update.mutate({ formId, title, description })` if title/description changed.
        7. Call `store.applyCreatedIds(tempToRealId)` and refresh `lastSyncedFields`.
      - On success, `router.push(`${basePath}/theme`)`.
      - Retain the `beforeunload` warning gated on `store.isDirty` and the cross-tab "leave with unsaved changes" dialog.
      - Hydrate the store from `trpc.form.getById` on mount (existing `useEffect` retained; defensively reset when `formId` changes).
    - Extract `buildFinalOrderIds(visibleFields, tempToRealMap)` as a pure helper (covered by unit tests in 3.8).
    - _Bug_Condition: 1.2 (silent auto-save, no Save & Continue), 1.3 (reorder drift omits just-created fields)_
    - _Expected_Behavior: 2.2 (no auto-save), 2.3 (Save & Continue persists creates / updates / deletes / final ordering and advances to Step 2), 2.10 (state preserved across step navigation), 2.11 (refresh / back / re-entry hydrate from DB), 2.12 (edit case pre-populates)_
    - _Preservation: 3.4 (sibling Settings tab unaffected), 3.8 (no schema changes)_
    - _Requirements: 2.2, 2.3, 2.10, 2.11, 2.12, 3.4, 3.8_

  - [~] 3.5 Rewrite Step 2 (Theme page) with shared customizer store, real-field live preview, working banner/logo upload, and Save & Continue persistence
    - Create `apps/web/lib/stores/theme-designer-store.ts` (Zustand) with: `presetThemeId`, `customColors`, `customFonts`, `customShape`, `bannerImageUrl`, `logoImageUrl`, `isDirty`, `lastSyncedSnapshot`, plus actions `setPreset`, `setCustomColor`, `setCustomFont`, `setCustomShape`, `setBannerImageUrl`, `setLogoImageUrl`, `reset`, `markSynced`.
    - In `apps/web/app/(dashboard)/dashboard/forms/[formId]/theme/page.tsx`:
      - On mount, hydrate the store from `trpc.form.getById`: `presetThemeId = formData.themeId ?? "default-light"`, `bannerImageUrl = formData.coverImageUrl`, `customColors`/`customFonts`/`customShape` = `formData.settings.themeConfig` if present else preset defaults, `logoImageUrl = formData.settings.logoUrl`.
      - Defensive reset when `formId` changes.
    - Refactor `ThemeLivePreview` to:
      - Accept `formData.fields` and render each persisted field through `<PreviewField>` preserving label, placeholder, helper text, required marker, and field type. Remove the hard-coded "Your name / Email address / Message" content.
      - Compute the derived `ThemeConfig` via a pure helper `mergeThemeConfig(preset, overrides)` (preset selected by `presetThemeId`, overridden by `customColors` / `customFonts` / `customShape`) and pass it to `FormThemeProvider`.
      - Empty-fields fallback: render a friendly "Add fields in the Editor step to see a preview" state.
    - Refactor `ThemeCustomizer` to:
      - Read from and write to `useThemeDesignerStore` (no more local `useState` for colors / fonts / shape / header).
      - Each `ColorPicker`, font `Select`, and `Slider` calls a store action that mutates the store and marks `isDirty`.
      - Replace "Apply Custom Theme" with "Apply" (no-op confirmation, since changes are already live in the preview) plus "Reset" (reverts to preset defaults via `store.reset`).
    - Implement banner / logo upload in the Header tab:
      - Replace the styled dropzone `<div>` with a controlled `<input type="file" accept="image/png,image/jpeg,image/webp">` plus an `onDragOver` / `onDrop` overlay.
      - On file select, POST `multipart/form-data` to `/api/upload` (existing Express route returning `{ url, fileId, name, size }`); show a spinner and disable the input while pending.
      - Optimistic 5MB pre-check on the client; full mime/magic-byte validation remains on the API via `validateFileMagicBytes`.
      - On success, call `setBannerImageUrl(url)` (or `setLogoImageUrl(url)`) and mark dirty.
      - On 4xx / 5xx, surface the error via the existing `toast` helper and leave the previous URL intact.
    - Add a "Save & Continue" button at the bottom of the page that calls `trpc.form.update.mutateAsync({ formId, themeId: presetThemeId, coverImageUrl: bannerImageUrl, settings: { ...currentSettings, themeConfig: { colors: customColors, fonts: customFonts, shape: customShape }, logoUrl: logoImageUrl } })`, then `router.push(`${basePath}/preview`)`. Mark synced and clear dirty on success.
    - Wire the "leave with unsaved changes" guard from `useThemeDesignerStore.isDirty` (same shape as Step 1).
    - _Bug_Condition: 1.4 (live preview hard-codes "Contact Form"), 1.5 (customizer is local-state-only and never applies / persists), 1.6 (banner upload non-functional), 1.9 (state reset on refresh), 1.10 (edit case loads defaults)_
    - _Expected_Behavior: 2.4 (live preview renders user's actual saved fields), 2.5 (customizer changes reflect instantly in preview), 2.6 (banner / logo upload through `/api/upload`, persisted on Save & Continue), 2.7 (Save & Continue persists theme + banner URL + logo URL and advances to Step 3), 2.10 / 2.11 / 2.12 (state survives navigation, refresh, re-entry, edit-case)_
    - _Preservation: 3.2 (public `/f/{slug}` rendering unchanged because preset `themeId` lookup remains the source of truth at runtime), 3.8 (no schema migration; only additive `settings.themeConfig` and `settings.logoUrl`)_
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.10, 2.11, 2.12, 3.2, 3.8_

  - [~] 3.6 Rewrite Step 3 (Preview page) to drop slug-gating and render Desktop / Tablet / Mobile simultaneously
    - In `apps/web/app/(dashboard)/dashboard/forms/[formId]/preview/page.tsx`, remove the slug-required empty state and the `<iframe src={`/f/${slug}?preview=true`}>` strategy.
    - Implement a new in-app `<FormPreview formId={formId} />` component that composes `FormThemeProvider` + the same `<FieldInput>` renderers used by `/f/{slug}`, driven by `formData.fields`, `formData.themeId`, `formData.settings.themeConfig`, and `formData.coverImageUrl` directly (no iframe, no slug).
    - Submissions are visually disabled in preview (`<button>` rendered but `onClick={(e) => e.preventDefault()}`) — same semantics as today's `?preview=true` mode.
    - Lay out three device frames side-by-side on `lg+` screens (Desktop 1280px, Tablet 768px, Mobile 375px), each a fixed-width container clipping `<FormPreview>` at the device's width. Wrap to a vertical stack on smaller viewports.
    - Empty-fields fallback: render "Add fields in the Editor step to see a preview" when `formData.fields` is empty.
    - Hydrate `formData` via `trpc.form.getById` on mount; survives refresh / back / re-entry.
    - _Bug_Condition: 1.7 (Step 3 requires a slug), 1.8 (single-device toggle, no on-screen Save Draft / Publish)_
    - _Expected_Behavior: 2.8 (render Desktop / Tablet / Mobile simultaneously without requiring a slug), 2.11 / 2.12 (refresh / re-entry hydrate from DB)_
    - _Preservation: 3.2 (public `/f/{slug}` unchanged — Step 3 no longer depends on it), 3.5 (status transitions remain consistent across surfaces)_
    - _Requirements: 2.8, 2.11, 2.12, 3.2, 3.5_

  - [~] 3.7 Add on-screen Save Draft and Publish actions to the Preview header
    - In `apps/web/app/(dashboard)/dashboard/forms/[formId]/preview/page.tsx`, add "Save Draft" and "Publish" buttons inside the Preview content area (NOT only on the layout top bar).
    - "Save Draft": call `trpc.form.update.mutate({ formId, ... })` to persist any final state and ensure `status === "draft"` (call `form.unpublish` only if currently published and the user explicitly intends to revert; otherwise just persist). Disable the button while the mutation is pending.
    - "Publish": call `trpc.form.publish.mutate({ formId })`. On success, surface a toast and remain on the Preview page. Disable the button while pending.
    - Both actions use existing tRPC procedures — no new procedures introduced. Status transitions and downstream side effects (analytics, share modal, `/f/{slug}` reachability) are unchanged.
    - _Bug_Condition: 1.8 (Step 3 lacks Save Draft / Publish on the screen itself)_
    - _Expected_Behavior: 2.9 (Save Draft persists and marks `status = "draft"`; Publish persists and marks `status = "published"`)_
    - _Preservation: 3.5 (status transitions across draft / published / archived continue to behave consistently in dashboard list, share modal, and respondent route), 3.6 (response recording, analytics counters, and email notifications unchanged)_
    - _Requirements: 2.9, 3.5, 3.6_

  - [~] 3.8 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Three-Step Flow End-to-End
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior; when it passes, it confirms each of the eleven defects (1.1 – 1.11) is resolved and the corresponding Expected Behaviors (2.1 – 2.13) hold
    - Run the bug condition exploration test from task 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Also run unit tests for `useFormEditorStore` (temp-to-real mapping, deleted-field tracking, dirty flag, hydration), `useThemeDesignerStore` (hydration, merge, reset), `mergeThemeConfig`, and `buildFinalOrderIds` to confirm the supporting pure helpers behave correctly
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

  - [~] 3.9 Verify preservation tests still pass
    - **Property 2: Preservation** - Out-of-Flow Surfaces Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run the preservation property tests from task 2 against the fixed code
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in dashboard list, public `/f/{slug}` route, out-of-flow management actions, sibling tabs, status transitions, response recording, analytics counters, email notifications, non-form-builder features, and DB schema)
    - Confirm no migration files were added under `packages/database/migrations`
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [~] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass (exploration, preservation, unit, integration), ask the user if questions arise.
  - Confirm the end-to-end create flow works: from `/dashboard`, "Create form" → Step 1 build three fields including a required one → Save & Continue → Step 2 switch to "Marvel: Spider-Verse" preset, change accent color, upload a PNG banner → Save & Continue → Step 3 Publish; verify the public `/f/{slug}` reflects every choice.
  - Confirm the end-to-end edit flow works: re-enter an existing themed form by navigating directly to `/dashboard/forms/{id}/theme`; the customizer hydrates with saved values, subsequent Save & Continue overwrites them correctly.
  - Confirm refresh / back-button resilience at every step.
  - Confirm out-of-flow regression: Duplicate, Archive, Delete, Share, Unpublish driven from both the layout top bar and the dashboard menu still work as before.

## Notes

- **No schema migration**: The fix is contained to UI surfaces, two Zustand stores, and an additive widening of `updateFormSchema`. The `forms.coverImageUrl`, `forms.themeId`, and `forms.settings` jsonb columns already exist and are used additively.
- **Existing endpoints reused**: `/api/upload` (Express), `form.create`, `form.update`, `form.publish`, `form.unpublish`, `field.create`, `field.update`, `field.delete`, `field.reorder` — all existing tRPC / REST procedures. No new procedures introduced.
- **Save & Continue is the persistence boundary**: per the design, no step writes to the DB silently. Step 3's Save Draft / Publish are the only exceptions because they are the explicit terminal actions of the flow.
- **Hydration on mount is mandatory**: every step hydrates from `trpc.form.getById` so refresh, back navigation, and re-entry by `formId` all work for both Create and Edit cases.
- **Live preview reads from stores, not from `themes.find` lookups**: this is how Step 2's "instant reflect" property is satisfied without persisting per-control.
- **Preservation tests are property-based**: the non-bug input space spans every dashboard / respondent / sibling-tab / management-action surface; PBT generates many cases automatically and provides stronger guarantees than hand-written unit tests.
