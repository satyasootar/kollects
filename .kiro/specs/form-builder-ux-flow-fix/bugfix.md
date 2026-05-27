# Bugfix Requirements Document

## Introduction

The form builder's Create → Design → Preview flow is broken end-to-end and does not match the intended product behavior. Users cannot complete the three-step authoring journey reliably: the entry point detours through a title-only commit page instead of going straight to the editor; the Theme Designer's live preview renders a hard-coded sample form instead of the user's actual fields; the customizer's color/font/shape/banner controls update only local React state and are never persisted; the banner/logo upload is non-functional; the Multi-Device Preview shows one device at a time, hides itself behind a slug requirement, and lacks Save Draft / Publish actions on the screen; persistence rules are inconsistent (silent auto-save on Step 1, lost state on Step 2). The fix is a full rewrite of the three-step flow so that each step persists explicitly on "Save & Continue", state survives refresh / back navigation / re-entry by `formId`, and Edit and Create paths share the same flow.

## Bug Analysis

### Current Behavior (Defect)

What currently happens when a user runs the form authoring flow.

1.1 WHEN the user clicks "Create form" on the dashboard THEN the system navigates to `/dashboard/forms/new`, which renders a title + description + template-picker page that requires a DB commit (`form.create`) before the user can reach the Form Editor.

1.2 WHEN the user is on Step 1 (Field Editor at `/dashboard/forms/{formId}/fields`) THEN the system can silently auto-save fields/title/description on a 10s debounce when the auto-save toggle is on, and the toolbar offers "Save Draft" + "Publish" instead of an explicit "Save & Continue" that advances to Step 2.

1.3 WHEN the user adds new fields and clicks "Save Draft" THEN newly created fields are persisted with real IDs but the reorder call only includes IDs that were already non-temporary at the time of save, so the persisted ordering can drift from what the user sees on screen.

1.4 WHEN the user opens Step 2 (Theme Designer at `/dashboard/forms/{formId}/theme`) THEN the right-hand "Live Preview" panel renders a hard-coded "Contact Form" with placeholder fields ("Your name", "Email address", "Message") regardless of what fields the user actually built.

1.5 WHEN the user changes colors, fonts, shape, or header settings in the Theme Designer's "Customize" tab THEN the changes update only local React state and the "Apply Custom Theme" button has no click handler, so nothing is reflected on the live preview, nothing is persisted to the DB, and the customizations are lost on navigation or refresh.

1.6 WHEN the user attempts to upload a banner / cover image in the "Customize → Header" tab THEN the dropzone is a non-functional visual placeholder with no file input and no upload handler, so no image is uploaded and no URL is persisted.

1.7 WHEN the user opens Step 3 (Preview at `/dashboard/forms/{formId}/preview`) and the form has no slug yet THEN the system displays "Set a slug in Settings to enable preview" and renders no preview at all.

1.8 WHEN the user opens Step 3 with a slug present THEN the system renders only one device at a time (Desktop OR Tablet OR Mobile via a toggle) and provides no "Save Draft" or "Publish" button on the Preview screen itself.

1.9 WHEN the user navigates between steps via the stepper, the browser back button, or a page refresh THEN any unsaved theme customizer state (colors, fonts, shape, banner, logo) is reset to component defaults because it is not loaded from the DB or any persisted store on mount.

1.10 WHEN the user re-enters the flow for a previously-saved form (Edit case) THEN Step 2's Customize tab loads its initial defaults (`#ffffff`, system fonts, radius 10) instead of hydrating from the form's persisted theme, so the form appears unstyled in the customizer even though the saved theme is still applied to the form.

1.11 WHEN the user is on any of Step 1, Step 2, or Step 3 THEN the step indicator's "Step 1 = Build" label and routing covers `/fields` and `/settings` together, blurring the Editor / Settings distinction and not consistently reflecting the three-step Editor → Design → Preview model the product requires.

### Expected Behavior (Correct)

What should happen instead.

2.1 WHEN the user clicks "Create form" on the dashboard THEN the system SHALL route directly to Step 1 (Form Editor) for a new draft identified by a stable `formId` propagated through the URL, without requiring the user to commit a title/description before seeing the editor.

2.2 WHEN the user is on Step 1 (Form Editor) THEN the system SHALL persist field additions, edits, deletions, reorderings, the form title, and the form description to the DB ONLY when the user explicitly clicks "Save & Continue", and SHALL NOT auto-save in the background.

2.3 WHEN the user clicks "Save & Continue" on Step 1 THEN the system SHALL persist all pending field changes (creates with real IDs, updates, deletes, and the final ordering of every visible field) and SHALL navigate to Step 2 (Theme Designer) using the same `formId`.

2.4 WHEN the user opens Step 2 (Theme Designer) THEN the system SHALL render the user's actual saved fields as the live preview, with the same field types, labels, placeholders, helper text, and required markers the user just built in Step 1.

2.5 WHEN the user changes any theme attribute on Step 2 (preset selection, color, font, border radius, spacing, button style, banner image, logo image) THEN the system SHALL reflect the change instantly in the live preview without writing to the DB.

2.6 WHEN the user uploads a banner / cover image or a logo on Step 2 THEN the system SHALL upload the file through the existing upload service, display it in the live preview, and SHALL persist its URL to the DB only when the user clicks "Save & Continue".

2.7 WHEN the user clicks "Save & Continue" on Step 2 THEN the system SHALL persist the theme configuration, banner image URL, and logo image URL to the DB and SHALL navigate to Step 3 (Multi-Device Preview) using the same `formId`.

2.8 WHEN the user opens Step 3 (Multi-Device Preview) THEN the system SHALL render the fully-styled form simultaneously in Desktop, Tablet, and Mobile frames using the persisted form data, without requiring a slug.

2.9 WHEN the user is on Step 3 THEN the system SHALL display "Save Draft" and "Publish" buttons on the Preview screen itself, where "Save Draft" persists any final state and marks `status = "draft"`, and "Publish" persists any final state and marks `status = "published"`.

2.10 WHEN the user navigates back from Step 3 to Step 2 or from Step 2 to Step 1 (via the step indicator, browser back, or an in-page Back action) THEN the system SHALL NOT reset state; previously-saved data SHALL come from the DB and any in-progress local edits SHALL be retained for the current session.

2.11 WHEN the user refreshes the browser, uses the browser back/forward buttons, or re-enters the flow at any step for an existing `formId` THEN the system SHALL hydrate the fields, title, description, theme configuration, banner URL, logo URL, and publish status from the DB so the form survives the navigation.

2.12 WHEN the user enters the flow for an existing form (Edit case, formId already present in the URL) THEN the system SHALL load the saved fields, theme, banner, and logo into Step 1 and Step 2 respectively, and SHALL run the user through the same three-step flow with the existing values pre-populated.

2.13 WHEN the user is on Step 1, Step 2, or Step 3 THEN the system SHALL show a visible step indicator labeled Editor → Design → Preview with the current step clearly marked active, and clicking a step in the indicator SHALL navigate to that step using the same `formId` without losing state per 2.10.

### Unchanged Behavior (Regression Prevention)

Existing behavior that must be preserved.

3.1 WHEN the user views the dashboard form list THEN the system SHALL CONTINUE TO list every form belonging to the user with its title, description, status, cover strip, and view/start/submission counts, and the status filter chips, stats row, and plan-limit warning SHALL CONTINUE TO behave as before.

3.2 WHEN a respondent visits a published form at `/f/{slug}` THEN the system SHALL CONTINUE TO render the form using its persisted theme and accept submissions, recording answers, views, and starts unchanged.

3.3 WHEN the user invokes form-management actions outside the three-step flow (Duplicate, Archive, Unarchive, Delete, Share, Unpublish from the layout top bar or the dashboard context menu) THEN the system SHALL CONTINUE TO perform those actions with the same outcomes and confirmation dialogs as before.

3.4 WHEN the user opens unrelated tabs in the form workspace (Settings, Email Settings, Analytics, Responses) THEN the system SHALL CONTINUE TO load and operate exactly as before; the three-step flow rewrite SHALL NOT alter those routes.

3.5 WHEN a form's `status` transitions to `published`, `draft`, or `archived` from any surface THEN the system SHALL CONTINUE TO honor that status consistently in the dashboard list, the share modal, and the respondent route.

3.6 WHEN the user submits a response on a published form THEN the system SHALL CONTINUE TO record the response, update analytics counts (`totalViews`, `totalStarts`, `totalSubmissions`, daily analytics rows), and trigger any configured email notifications unchanged.

3.7 WHEN the user creates or edits API keys, templates, account settings, or any other non-form-builder feature THEN the system SHALL CONTINUE TO behave identically to before this fix.

3.8 WHEN the existing DB schema is read (`forms`, `form_fields`, `themes`, related tables) THEN the system SHALL CONTINUE TO use the existing tables and columns without breaking-change migrations; any new persistence needs SHALL be satisfied by additive use of existing columns (e.g. `forms.coverImageUrl`, `forms.themeId`, `forms.settings`, `themes.config`) before introducing new schema.
