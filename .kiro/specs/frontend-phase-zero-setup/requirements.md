# Requirements Document

## Introduction

This specification covers Phase 0 ("Pre-Flight: Conventions & Ground Rules") of the KOLLECTS.TECH frontend implementation plan. The goal is to establish the foundational tooling, test infrastructure, and project conventions that all subsequent phases depend on. This includes configuring Vitest as the unit/component test runner, installing required runtime dependencies (drag-and-drop, phone validation, QR codes), adding accessibility testing to the existing Playwright setup, and codifying architectural conventions as enforceable lint rules or documented constraints.

## Glossary

- **Web_App**: The Next.js 16 frontend application located at `apps/web` in the monorepo
- **Vitest_Runner**: The Vitest test framework configured to run unit and component tests in a jsdom environment
- **RTL**: React Testing Library — the component testing utilities (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)
- **Playwright_Config**: The existing Playwright end-to-end test configuration at `apps/web/playwright.config.ts`
- **Package_Manager**: pnpm with workspace protocol, used for all dependency management
- **Path_Alias**: The `~/` import alias configured in `tsconfig.json` and `components.json` that resolves to the `apps/web` root
- **Shared_Schemas**: Zod schemas, constants, and types exported from `@repo/database`
- **TRPC_Client**: The tRPC v11 client wiring at `apps/web/trpc/client.ts` used for all backend communication

## Requirements

### Requirement 1: Vitest Test Runner Installation

**User Story:** As a frontend developer, I want a unit and component test runner configured in the web app, so that I can write fast, isolated tests for components and utilities without relying on end-to-end tests.

#### Acceptance Criteria

1. WHEN a developer runs `pnpm --filter web test`, THE Vitest_Runner SHALL execute all test files matching `**/*.test.{ts,tsx}` within `apps/web` and report results to stdout, exiting with code 0 on all tests passing and a non-zero exit code when one or more tests fail
2. THE Vitest_Runner SHALL exclude files in `**/tests/e2e/**`, `node_modules`, and `.next` directories from test discovery
3. THE Vitest_Runner SHALL use `jsdom` as the test environment to provide DOM APIs for component testing
4. THE Vitest_Runner SHALL expose test globals (`describe`, `it`, `expect`, `vi`) without requiring explicit imports in test files
5. WHEN a test file imports a module using the `~/` path alias, THE Vitest_Runner SHALL resolve the alias to the `apps/web` root directory, consistent with the path mapping defined in `tsconfig.json`
6. THE Web_App SHALL include a `vitest.config.ts` file at its root that configures the React plugin, jsdom environment, global test APIs, a setup file located at `./vitest.setup.ts`, exclusions, and the `~/` path alias
7. THE Web_App SHALL declare `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `@testing-library/dom` as devDependencies in its `package.json`

### Requirement 2: Test Setup and DOM Matchers

**User Story:** As a frontend developer, I want extended DOM matchers and browser API polyfills available in all tests, so that I can write assertions like `toBeInTheDocument()` and test motion-preference logic without manual setup.

#### Acceptance Criteria

1. THE Vitest_Runner SHALL load a setup file (`vitest.setup.ts`) before each test suite that extends `expect` with all `@testing-library/jest-dom` matchers so that assertions such as `toBeInTheDocument()`, `toHaveAttribute()`, and `toBeVisible()` are available on every `expect` call
2. THE Vitest_Runner SHALL provide a `window.matchMedia` polyfill in the setup file that returns a MediaQueryList-compatible object with `matches` defaulting to `false`, and implementing `addEventListener`, `removeEventListener`, and `dispatchEvent` methods, so that tests querying `prefers-reduced-motion` receive a functional stub
3. WHEN a test uses `expect(element).toBeInTheDocument()`, THE Vitest_Runner SHALL resolve the matcher without additional imports in the test file
4. WHEN a test needs to simulate `prefers-reduced-motion: reduce` being active, THE Vitest_Runner SHALL allow the test to override the `matchMedia` polyfill return value so that both motion-enabled and motion-reduced code paths are testable within the same suite

### Requirement 3: Package.json Test Scripts

**User Story:** As a developer, I want standardized npm scripts for running tests, so that CI pipelines and other developers use consistent commands.

#### Acceptance Criteria

1. THE Web_App SHALL expose a `test` script in `package.json` that runs `vitest --run` (single execution, no watch mode)
2. THE Web_App SHALL expose a `test:watch` script in `package.json` that runs `vitest` in watch mode for local development
3. THE Web_App SHALL expose a `test:e2e` script in `package.json` that runs `playwright test`
4. WHEN any test script (`test`, `test:watch`, or `test:e2e`) completes with one or more test failures, THE Web_App SHALL exit with a non-zero exit code

### Requirement 4: TypeScript Configuration for Test Globals

**User Story:** As a developer, I want TypeScript to recognize Vitest globals and jest-dom matchers without red squiggles, so that the IDE provides accurate type checking in test files.

#### Acceptance Criteria

1. THE Web_App SHALL include `vitest/globals` in the TypeScript compiler `types` array so that global test functions are recognized
2. THE Web_App SHALL include `@testing-library/jest-dom` in the TypeScript compiler `types` array so that extended matchers have correct type definitions
3. WHEN a developer runs `pnpm --filter web check-types`, THE Web_App SHALL pass type checking including all test files

### Requirement 5: Drag-and-Drop Dependencies

**User Story:** As a frontend developer, I want the dnd-kit libraries available as production dependencies, so that I can implement field reordering in the form builder without additional installation steps.

#### Acceptance Criteria

1. THE Web_App SHALL list `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` as production dependencies in the `dependencies` section (not `devDependencies`) of `package.json`, each with a caret-range version specifier consistent with the project's existing versioning convention
2. WHEN a component imports from any of `@dnd-kit/core`, `@dnd-kit/sortable`, or `@dnd-kit/utilities`, THE Web_App SHALL resolve the import and complete a production build without module-resolution or type-resolution errors
3. THE Web_App SHALL install versions of `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` that declare compatibility with the project's current React peer-dependency version

### Requirement 6: Phone Validation Dependency

**User Story:** As a frontend developer, I want the `libphonenumber-js` library available, so that I can implement phone field parsing and validation in form-fill views.

#### Acceptance Criteria

1. THE Web_App SHALL list `libphonenumber-js` as a production dependency in `package.json`
2. WHEN a component imports `parsePhoneNumberFromString` from `libphonenumber-js`, THE Web_App SHALL resolve the import without errors

### Requirement 7: QR Code Dependency

**User Story:** As a frontend developer, I want the `qrcode.react` library available, so that I can render QR codes in the share modal.

#### Acceptance Criteria

1. THE Web_App SHALL list `qrcode.react` as a production dependency in `package.json`
2. WHEN a component imports `QRCodeSVG` from `qrcode.react`, THE Web_App SHALL resolve the import without errors

### Requirement 8: Accessibility Testing for Playwright

**User Story:** As a QA engineer, I want axe-core integrated with Playwright, so that end-to-end tests can assert pages have no accessibility violations.

#### Acceptance Criteria

1. THE Web_App SHALL list `@axe-core/playwright` as a dev dependency in `package.json`
2. WHEN an e2e test imports `AxeBuilder` from `@axe-core/playwright` and runs `await new AxeBuilder({ page }).analyze()`, THE Playwright_Config SHALL support the execution without additional configuration
3. WHEN axe-core detects accessibility violations, THE Playwright_Config SHALL report them as test failures with violation details

### Requirement 9: Convention — No Bypassing tRPC

**User Story:** As a tech lead, I want a documented and enforceable rule that all backend communication goes through tRPC, so that type safety and cache coherence are maintained.

#### Acceptance Criteria

1. THE Web_App SHALL document that all backend calls use `trpc.<router>.<proc>.useQuery` or `useMutation` from `~/trpc/client`
2. THE Web_App SHALL document that the only permitted REST exception is `POST /api/upload`
3. IF a component makes a direct `fetch()` call to a backend endpoint other than `/api/upload`, THEN THE Web_App SHALL flag the violation during code review or lint

### Requirement 10: Convention — No Duplicating Zod Schemas

**User Story:** As a tech lead, I want all form validation schemas imported from `@repo/database`, so that frontend and backend validation never drift apart.

#### Acceptance Criteria

1. THE Web_App SHALL import all Zod validation schemas from `@repo/database` rather than defining local duplicates
2. THE Web_App SHALL use `@hookform/resolvers/zod` to connect shared schemas to `react-hook-form`
3. IF a new Zod schema is defined locally in `apps/web` that duplicates a schema available in `@repo/database`, THEN THE Web_App SHALL flag the violation during code review

### Requirement 11: Convention — No Modifying shadcn Primitives

**User Story:** As a tech lead, I want shadcn UI primitives to remain unmodified, so that running `shadcn add` does not overwrite custom logic.

#### Acceptance Criteria

1. THE Web_App SHALL treat all files in `components/ui/*` as read-only except for `button.tsx` and `badge.tsx`
2. WHERE additional `cva` variants are needed, THE Web_App SHALL add them only to `button.tsx` or `badge.tsx`
3. IF a developer modifies any other file in `components/ui/*`, THEN THE Web_App SHALL flag the violation during code review

### Requirement 12: Convention — Chrome and Form Isolation

**User Story:** As a tech lead, I want chrome components and form-field/form-theme components to remain isolated, so that the gallery UI never bleeds into the form-fill experience.

#### Acceptance Criteria

1. THE Web_App SHALL prohibit imports from `~/components/chrome/*` inside any file within `~/components/form-fields/*` or `~/components/form-themes/*`
2. IF a file in `form-fields` or `form-themes` imports from `chrome`, THEN THE Web_App SHALL flag the violation during lint or code review

### Requirement 13: Convention — Path Alias Usage

**User Story:** As a developer, I want all internal imports to use the `~/` alias, so that import paths are consistent and refactor-friendly.

#### Acceptance Criteria

1. THE Web_App SHALL use the `~/` import alias for all internal imports within `apps/web`
2. THE Web_App SHALL have the alias configured in both `tsconfig.json` (paths: `~/*` → `./*`) and `vitest.config.ts` (resolve.alias)
3. IF a file uses a relative import that traverses more than one parent directory (e.g., `../../components/...`), THEN THE Web_App SHALL flag the violation during lint or code review

### Requirement 14: Convention — Respect prefers-reduced-motion

**User Story:** As a developer building accessible interfaces, I want a global reduced-motion guard, so that users who prefer reduced motion are never subjected to distracting animations.

#### Acceptance Criteria

1. THE Web_App SHALL include a global CSS rule `@media (prefers-reduced-motion: reduce)` that sets `animation-duration` to 0.01ms, `transition-duration` to 0.01ms, `animation-iteration-count` to 1, and `scroll-behavior` to auto on all elements including `::before` and `::after` pseudo-elements
2. WHEN a user has `prefers-reduced-motion: reduce` enabled, THE Web_App SHALL render pages with no CSS animations playing and no CSS transitions occurring beyond the 0.01ms collapse defined in the global rule
3. THE Web_App SHALL provide a `useReducedMotion` hook that returns a boolean (`true` when the user prefers reduced motion) by subscribing to the `prefers-reduced-motion` media query, so that components can conditionally skip JavaScript-driven animations
4. WHEN the user toggles their operating-system motion preference while the Web_App is open, THE Web_App SHALL update the `useReducedMotion` return value within 100ms and reflect the new preference without requiring a page reload

### Requirement 15: Verification Gate

**User Story:** As a developer, I want a clear definition of done for Phase 0, so that I know the tooling setup is complete and correct before moving to Phase 1.

#### Acceptance Criteria

1. WHEN a developer runs `pnpm --filter web check-types`, THE Web_App SHALL complete with exit code 0 and produce zero type errors in the output
2. WHEN a developer runs `pnpm --filter web lint`, THE Web_App SHALL complete with exit code 0 and produce zero warnings or errors in the output
3. WHEN a developer runs `pnpm --filter web test`, THE Vitest_Runner SHALL complete with exit code 0, even if no test files matching the configured pattern exist
4. WHEN a developer runs `pnpm --filter web test:e2e`, THE Playwright_Config SHALL be loaded without parsing errors and the command SHALL complete with exit code 0
5. IF any of the four verification commands (`check-types`, `lint`, `test`, `test:e2e`) exits with a non-zero exit code, THEN THE Web_App SHALL produce output indicating which tool failed and the nature of the failure
