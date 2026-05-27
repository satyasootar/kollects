/**
 * Form Builder UX Flow — Bug Condition Exploration Test
 *
 * Property 1: Bug Condition — Three-Step Flow End-to-End Defects
 *
 * **CRITICAL**: This test is EXPECTED TO FAIL on the unfixed code. Each sub-case
 * (1.1 — 1.11) corresponds 1:1 to a numbered defect in
 * `.kiro/specs/form-builder-ux-flow-fix/bugfix.md` and the `isBugCondition`
 * specification in `design.md`.
 *
 * Failures of this test surface the counterexamples that prove each defect
 * exists. After the fix tasks (3.1 — 3.7) land, this same test must pass and
 * thereby validate Property 1 (Expected Behavior 2.1 — 2.13).
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11**
 */

import * as React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import * as fc from "fast-check";

import DashboardPage from "../dashboard/page";
import FieldsPage from "../dashboard/forms/[formId]/fields/page";
import ThemeDesignPage from "../dashboard/forms/[formId]/theme/page";
import PreviewPage from "../dashboard/forms/[formId]/preview/page";
import FormEditorLayout from "../dashboard/forms/[formId]/layout";
import { useFormEditorStore } from "~/lib/stores/form-editor-store";

// ─────────────────────────────────────────────────────────────────────────────
// Shared mutable mock state (must be hoisted alongside vi.mock factories)
// ─────────────────────────────────────────────────────────────────────────────

const { mockTrpc, mockMutations, mockRouter } = vi.hoisted(() => ({
  mockTrpc: {
    formData: null as any,
    formList: [] as any[],
    templates: [] as any[],
    user: { plan: "free" } as any,
    pathname: "/dashboard",
    fieldCreateReturn: null as null | ((input: any) => any),
  },
  mockMutations: {
    formCreate: vi.fn(),
    formUpdate: vi.fn(),
    formPublish: vi.fn(),
    formUnpublish: vi.fn(),
    formArchive: vi.fn(),
    formDelete: vi.fn(),
    formClone: vi.fn(),
    fieldCreate: vi.fn(),
    fieldUpdate: vi.fn(),
    fieldDelete: vi.fn(),
    fieldReorder: vi.fn(),
    fieldBulkSync: vi.fn(),
  },
  mockRouter: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// next/navigation, next/link
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ formId: mockTrpc.formData?.id ?? "form-1" }),
  usePathname: () => mockTrpc.pathname,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// tRPC client mock — reads from `mockTrpc` so each sub-case can configure state
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("~/trpc/client", () => {
  const queryFn = (selector: () => any) => () => ({
    data: selector(),
    isLoading: false,
    isError: false,
  });

  const mutationFactory = (mutateFn: any, opts?: { resolve?: () => any }) => () => {
    let cbOpts: any = null;
    return {
      mutate: (...args: any[]) => {
        mutateFn(...args);
        return cbOpts?.onSuccess?.(opts?.resolve?.() ?? undefined);
      },
      mutateAsync: async (...args: any[]) => {
        mutateFn(...args);
        return opts?.resolve?.() ?? undefined;
      },
      isPending: false,
    };
  };

  return {
    trpc: {
      auth: {
        me: { useQuery: queryFn(() => mockTrpc.user) },
      },
      template: {
        listSystem: { useQuery: queryFn(() => mockTrpc.templates) },
      },
      form: {
        list: { useQuery: queryFn(() => mockTrpc.formList) },
        getById: { useQuery: queryFn(() => mockTrpc.formData) },
        getByIdWithFields: { useQuery: queryFn(() => mockTrpc.formData) },
        create: {
          useMutation: (opts?: any) => ({
            mutate: (input: any) => {
              mockMutations.formCreate(input);
              opts?.onSuccess?.({ id: "scaffold-form-id" });
            },
            mutateAsync: async (input: any) => {
              mockMutations.formCreate(input);
              return { id: "scaffold-form-id" };
            },
            isPending: false,
          }),
        },
        update: { useMutation: mutationFactory(mockMutations.formUpdate) },
        publish: { useMutation: mutationFactory(mockMutations.formPublish) },
        unpublish: { useMutation: mutationFactory(mockMutations.formUnpublish) },
        archive: { useMutation: mutationFactory(mockMutations.formArchive) },
        delete: { useMutation: mutationFactory(mockMutations.formDelete) },
        clone: { useMutation: mutationFactory(mockMutations.formClone) },
      },
      field: {
        create: {
          useMutation: () => ({
            mutate: mockMutations.fieldCreate,
            mutateAsync: async (input: any) => {
              mockMutations.fieldCreate(input);
              return mockTrpc.fieldCreateReturn?.(input) ?? {
                id: `real_${Math.random().toString(36).slice(2, 8)}`,
                ...input,
              };
            },
            isPending: false,
          }),
        },
        update: { useMutation: mutationFactory(mockMutations.fieldUpdate) },
        delete: { useMutation: mutationFactory(mockMutations.fieldDelete) },
        reorder: { useMutation: mutationFactory(mockMutations.fieldReorder) },
        bulkSync: { useMutation: mutationFactory(mockMutations.fieldBulkSync) },
      },
      useUtils: () => ({
        form: {
          getById: { invalidate: vi.fn() },
          list: { invalidate: vi.fn() },
        },
      }),
    },
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Stub heavy/irrelevant components so we can render the pages in jsdom
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("~/components/chrome", () => ({
  TintCard: Object.assign(
    ({ children }: any) => <div>{children}</div>,
    {
      Number: ({ children }: any) => <div>{children}</div>,
      Caption: ({ children }: any) => <p>{children}</p>,
    },
  ),
  NumberTicker: ({ value, suffix }: any) => <span>{value}{suffix ?? ""}</span>,
  Doodle: () => <span data-testid="doodle" />,
  EditorialCard: ({ children }: any) => <div>{children}</div>,
  StatusBadge: ({ status }: any) => <span>{status}</span>,
  EmptyState: ({ headline, action }: any) => (
    <div>
      <h2>{headline}</h2>
      {action}
    </div>
  ),
}));

vi.mock("~/components/form-builder/field-palette", () => ({
  FieldPalette: ({ onAddField }: any) => (
    <button data-testid="palette-add-field" onClick={() => onAddField("short_text")}>
      add
    </button>
  ),
}));

vi.mock("~/components/form-builder/form-canvas", () => ({
  FormCanvas: ({ fields }: any) => (
    <div data-testid="form-canvas">
      {fields.map((f: any) => (
        <div key={f.id} data-field-id={f.id}>
          {f.label}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("~/components/form-builder/field-settings", () => ({
  FieldSettings: () => <div data-testid="field-settings" />,
}));

vi.mock("~/components/form-builder/share-modal", () => ({
  ShareModal: () => null,
}));

// Mock the form-editor store to avoid a zustand + React 19 + vitest hook
// resolution issue when rendering the FieldsPage. We provide a minimal stand-in
// with the same surface area the page component reads from.
const editorStoreState = vi.hoisted(() => {
  const state: any = {
    formId: null,
    title: "",
    description: "",
    fields: [],
    selectedFieldId: null,
    isDirty: false,
    lastSavedAt: null,
    autoSaveEnabled: false,
  };
  return state;
});

vi.mock("~/lib/stores/form-editor-store", () => {
  let counter = 0;
  const tempId = () => `temp_${++counter}`;
  const mutate = () => {
    // no listeners — components re-render via React state we don't have here.
    // Tests assert on mutations + dirty flags, not on the page reflecting changes.
  };

  const api: any = {
    setFormData(formId: string, title: string, description: string, fields: any[]) {
      editorStoreState.formId = formId;
      editorStoreState.title = title;
      editorStoreState.description = description;
      editorStoreState.fields = fields;
      editorStoreState.isDirty = false;
      editorStoreState.selectedFieldId = null;
      mutate();
    },
    setTitle(t: string) {
      editorStoreState.title = t;
      editorStoreState.isDirty = true;
      mutate();
    },
    setDescription(d: string) {
      editorStoreState.description = d;
      editorStoreState.isDirty = true;
      mutate();
    },
    addField(type: string) {
      const f = { id: tempId(), type, label: `New ${type} field`, required: false };
      editorStoreState.fields = [...editorStoreState.fields, f];
      editorStoreState.selectedFieldId = f.id;
      editorStoreState.isDirty = true;
      mutate();
    },
    updateField(id: string, data: any) {
      editorStoreState.fields = editorStoreState.fields.map((f: any) =>
        f.id === id ? { ...f, ...data } : f,
      );
      editorStoreState.isDirty = true;
      mutate();
    },
    deleteField(id: string) {
      editorStoreState.fields = editorStoreState.fields.filter((f: any) => f.id !== id);
      if (editorStoreState.selectedFieldId === id) editorStoreState.selectedFieldId = null;
      editorStoreState.isDirty = true;
      mutate();
    },
    reorderFields(ids: string[]) {
      const map = new Map(editorStoreState.fields.map((f: any) => [f.id, f]));
      editorStoreState.fields = ids.map((id) => map.get(id)).filter(Boolean);
      editorStoreState.isDirty = true;
      mutate();
    },
    selectField(id: string | null) {
      editorStoreState.selectedFieldId = id;
      mutate();
    },
    markSaved() {
      editorStoreState.isDirty = false;
      editorStoreState.lastSavedAt = Date.now();
      mutate();
    },
    markDirty() {
      editorStoreState.isDirty = true;
      mutate();
    },
    toggleAutoSave() {
      editorStoreState.autoSaveEnabled = !editorStoreState.autoSaveEnabled;
      mutate();
    },
    reset() {
      editorStoreState.formId = null;
      editorStoreState.title = "";
      editorStoreState.description = "";
      editorStoreState.fields = [];
      editorStoreState.selectedFieldId = null;
      editorStoreState.isDirty = false;
      editorStoreState.lastSavedAt = null;
      mutate();
    },
  };

  function useFormEditorStore() {
    return new Proxy(api, {
      get(_target, prop: string) {
        if (prop in api) return api[prop];
        return (editorStoreState as any)[prop];
      },
    });
  }
  (useFormEditorStore as any).getState = () => ({ ...editorStoreState, ...api });
  (useFormEditorStore as any).setState = (partial: any) => {
    Object.assign(editorStoreState, partial);
    mutate();
  };

  return { useFormEditorStore };
});

vi.mock("~/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("~/lib/api-error", () => ({
  handleTrpcError: vi.fn(),
}));

// Mock the ColorPicker’s underlying Input to a plain native input so we can read its value.
// (No mock needed — the real Input renders a <input>.)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function resetAll() {
  Object.values(mockMutations).forEach((m) => m.mockReset());
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.back.mockReset();
  mockTrpc.formData = null;
  mockTrpc.formList = [];
  mockTrpc.templates = [];
  mockTrpc.user = { plan: "free" };
  mockTrpc.pathname = "/dashboard";
  mockTrpc.fieldCreateReturn = null;
  // Reset zustand store
  useFormEditorStore.setState({
    formId: null,
    title: "",
    description: "",
    fields: [],
    selectedFieldId: null,
    isDirty: false,
    lastSavedAt: null,
    autoSaveEnabled: false,
  });
}

const baseForm = (over: Partial<any> = {}) => ({
  id: "form-1",
  title: "Untitled form",
  description: "",
  status: "draft",
  slug: null,
  themeId: "default-light",
  coverImageUrl: null,
  visibility: "public",
  fields: [],
  settings: {},
  ...over,
});

beforeEach(() => {
  resetAll();
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug condition sub-cases (1.1 — 1.11)
// ─────────────────────────────────────────────────────────────────────────────

describe("Bug Condition — Three-Step Flow End-to-End Defects", () => {
  // ───────────────────────────────────────────────────────────────────────────
  describe("1.1 Entry detour — Create form must route directly to Step 1", () => {
    it("clicking 'Create form' on /dashboard does NOT detour through /dashboard/forms/new", async () => {
      mockTrpc.formList = [];
      render(<DashboardPage />);

      // fast-check: every "Create form" affordance on the dashboard must lead
      // straight into Step 1 under a real formId, never to the title-commit page.
      const createTriggers = screen.getAllByRole("link", { name: /create form/i });
      expect(createTriggers.length).toBeGreaterThan(0);

      fc.assert(
        fc.property(fc.constantFrom(...createTriggers), (trigger) => {
          const href = (trigger as HTMLAnchorElement).getAttribute("href") ?? "";
          // Expected: /dashboard/forms/{uuid}/fields. NEVER /dashboard/forms/new.
          return (
            href !== "/dashboard/forms/new" &&
            /^\/dashboard\/forms\/[^/]+\/fields$/.test(href)
          );
        }),
        { numRuns: createTriggers.length, seed: 1 },
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.2 Silent auto-save / missing Save & Continue", () => {
    it("Step 1 must NOT silently auto-save and MUST expose a 'Save & Continue' button", async () => {
      vi.useFakeTimers();
      try {
        mockTrpc.formData = baseForm({
          fields: [
            { id: "ex_1", type: "short_text", label: "Existing", required: false },
          ],
        });

        // Pre-populate the editor store with auto-save enabled and a dirty edit
        // BEFORE the page renders, so the unfixed page's auto-save useEffect
        // schedules its 10s debounce at the very first render.
        useFormEditorStore.setState({
          formId: "form-1",
          title: "Edited title",
          description: "",
          fields: [
            { id: "ex_1", type: "short_text", label: "Existing", required: false },
          ],
          isDirty: true,
          autoSaveEnabled: true,
        });

        render(<FieldsPage />);

        // Wait 11s without the user clicking save.
        await act(async () => {
          await vi.advanceTimersByTimeAsync(11_000);
        });

        // Expected (Property 2.2): no auto-save mutations fire.
        expect(mockMutations.formUpdate).not.toHaveBeenCalled();
        expect(mockMutations.fieldUpdate).not.toHaveBeenCalled();
        expect(mockMutations.fieldCreate).not.toHaveBeenCalled();

        // Expected (Property 2.3): a 'Save & Continue' button is rendered.
        expect(
          screen.queryByRole("button", { name: /save\s*&\s*continue/i }),
        ).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.3 Reorder drift — reorder must include just-created real IDs", () => {
    it("after adding two new fields and saving, reorder is called with the FULL final order", async () => {
      mockTrpc.formData = baseForm({
        fields: [
          { id: "ex_1", type: "short_text", label: "First (existing)", required: false },
        ],
      });

      // field.create returns deterministic real IDs in order, so we can assert
      // the merged final order = [existing, real_1, real_2].
      let createCounter = 0;
      mockTrpc.fieldCreateReturn = (input) => ({
        id: `real_${++createCounter}`,
        ...input,
      });

      // Pre-populate the editor store BEFORE rendering so the Save Draft / Save & Continue
      // button is enabled (isDirty = true) on the very first render. The unfixed page
      // computes `existingFieldIds = fields.filter(f => !f.id.startsWith("temp_"))` and
      // passes ONLY that to reorder — drifting the just-created real IDs.
      useFormEditorStore.setState({
        formId: "form-1",
        title: mockTrpc.formData.title,
        description: mockTrpc.formData.description ?? "",
        fields: [
          { id: "ex_1", type: "short_text", label: "First (existing)", required: false },
          { id: "temp_a", type: "short_text", label: "Added 1", required: false },
          { id: "temp_b", type: "short_text", label: "Added 2", required: false },
        ],
        isDirty: true,
      });

      render(<FieldsPage />);

      // Click whatever save affordance is offered (Save & Continue when fixed,
      // Save Draft when unfixed).
      const saveBtn =
        screen.queryByRole("button", { name: /save\s*&\s*continue/i }) ??
        screen.queryByRole("button", { name: /save draft/i });
      expect(saveBtn).not.toBeNull();

      await act(async () => {
        fireEvent.click(saveBtn as HTMLElement);
        // Allow the queued mutations to settle.
        for (let i = 0; i < 5; i++) await Promise.resolve();
      });

      // Two field.create calls should have happened (one per temp_ field).
      expect(mockMutations.fieldCreate).toHaveBeenCalledTimes(2);

      // The reorder payload MUST be the full list including the just-created real IDs.
      // Expected: ["ex_1", "real_1", "real_2"]. On unfixed code it is ["ex_1"] only.
      expect(mockMutations.fieldReorder).toHaveBeenCalled();
      const reorderArgs = mockMutations.fieldReorder.mock.calls.at(-1)?.[0];
      expect(reorderArgs).toBeDefined();
      expect(reorderArgs.formId).toBe("form-1");
      expect(reorderArgs.fieldIds).toEqual(["ex_1", "real_1", "real_2"]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.4 Hard-coded preview — live preview must render user fields", () => {
    it.each([
      ["Favorite color?"],
      ["What's your superpower?"],
      ["Pick a number between 1 and 100"],
    ])(
      "Step 2 live preview shows the user's field label %p and not 'Your name / Email address / Message'",
      async (userLabel) => {
        mockTrpc.formData = baseForm({
          fields: [{ id: "f_1", type: "short_text", label: userLabel, required: false }],
        });

        render(<ThemeDesignPage />);

        // Wait for async theme loading to complete.
        await waitFor(() => {
          expect(
            screen.queryAllByText(/preset themes/i).length +
              screen.queryAllByText(/customize/i).length,
          ).toBeGreaterThan(0);
        });

        // Expected (Property 2.4): user's field appears in the preview.
        expect(screen.queryByText(userLabel)).toBeInTheDocument();

        // Expected: the hard-coded "Your name / Email address / Message" trio is NOT present.
        expect(screen.queryByText("Your name")).not.toBeInTheDocument();
        expect(screen.queryByText("Email address")).not.toBeInTheDocument();
        expect(screen.queryByText("Message")).not.toBeInTheDocument();
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.5 Customizer no-op — changes must apply and Save & Continue must persist", () => {
    it("Step 2 customize tab exposes a Save & Continue button (not a no-op 'Apply Custom Theme')", async () => {
      mockTrpc.formData = baseForm();
      render(<ThemeDesignPage />);

      // Switch to the Customize sub-mode.
      const customizeBtn = await screen.findByRole("button", { name: /^customize$/i });
      await act(async () => {
        fireEvent.click(customizeBtn);
      });

      // Expected (Property 2.7): a Save & Continue button persists theme + assets.
      expect(
        screen.queryByRole("button", { name: /save\s*&\s*continue/i }),
      ).toBeInTheDocument();
    });

    it("clicking Save & Continue persists themeConfig via form.update", async () => {
      mockTrpc.formData = baseForm();
      render(<ThemeDesignPage />);

      const customizeBtn = await screen.findByRole("button", { name: /^customize$/i });
      await act(async () => {
        fireEvent.click(customizeBtn);
      });

      const saveContinue = screen.queryByRole("button", {
        name: /save\s*&\s*continue/i,
      });
      // If no such button exists the next assertion fails — bug confirmed.
      expect(saveContinue).not.toBeNull();

      await act(async () => {
        fireEvent.click(saveContinue as HTMLElement);
        await Promise.resolve();
      });

      // Expected: form.update is called with themeConfig in settings.
      expect(mockMutations.formUpdate).toHaveBeenCalled();
      const args = mockMutations.formUpdate.mock.calls.at(-1)?.[0];
      expect(args?.formId).toBe("form-1");
      expect(args?.settings?.themeConfig).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.6 Banner upload non-functional — Header tab must accept file uploads", () => {
    it("Step 2 Header tab exposes a real <input type='file'> for banner upload", async () => {
      mockTrpc.formData = baseForm();
      const { container } = render(<ThemeDesignPage />);

      const customizeBtn = await screen.findByRole("button", { name: /^customize$/i });
      await act(async () => {
        fireEvent.click(customizeBtn);
      });

      // Open the Header tab.
      const headerTab = await screen.findByRole("tab", { name: /header/i });
      await act(async () => {
        fireEvent.click(headerTab);
      });

      // Expected (Property 2.6): an actual file input exists.
      const fileInputs = container.querySelectorAll('input[type="file"]');
      expect(fileInputs.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.7 Slug-gated Step 3 — Preview must render without a slug", () => {
    it("Preview page on a fresh form (no slug) renders preview frames, not the empty state", () => {
      mockTrpc.formData = baseForm({
        slug: null,
        fields: [{ id: "f_1", type: "short_text", label: "Sample", required: false }],
      });

      const { container } = render(<PreviewPage />);

      // Expected (Property 2.8): the slug empty-state is NOT shown.
      expect(
        screen.queryByText(/set a slug in settings/i),
      ).not.toBeInTheDocument();

      // Expected: at least one preview frame (iframe or styled container) is rendered.
      const frames =
        container.querySelectorAll("iframe").length +
        container.querySelectorAll('[data-testid^="preview-frame"]').length;
      expect(frames).toBeGreaterThanOrEqual(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.8 Single-device + no on-screen Publish — three frames + Publish button", () => {
    it("Preview page renders >= 3 device frames at 1280 / 768 / 375 widths", () => {
      mockTrpc.formData = baseForm({
        slug: "my-form",
        fields: [{ id: "f_1", type: "short_text", label: "Sample", required: false }],
      });

      const { container } = render(<PreviewPage />);

      // Collect every element with an inline width matching one of the device widths,
      // OR every iframe rendered (the unfixed code emits exactly one iframe).
      const widths = [1280, 768, 375];
      const matches = Array.from(
        container.querySelectorAll<HTMLElement>("iframe, div"),
      ).filter((el) => {
        const w = el.style.width;
        return widths.some((target) => w === `${target}px`);
      });

      // Expected (Property 2.8): all three device frames exist simultaneously.
      expect(matches.length).toBeGreaterThanOrEqual(3);
    });

    it("Preview page exposes an on-screen 'Publish' button (not just on the layout top bar)", () => {
      mockTrpc.formData = baseForm({
        slug: "my-form",
        fields: [{ id: "f_1", type: "short_text", label: "Sample", required: false }],
      });

      render(<PreviewPage />);

      // Expected (Property 2.9): Publish + Save Draft on the Preview screen itself.
      expect(
        screen.queryByRole("button", { name: /^publish$/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /save draft/i }),
      ).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.9 State reset on refresh — customizer hydrates from persisted settings", () => {
    it("after a refresh, Step 2 customizer reflects persisted themeConfig.colors.accent", async () => {
      mockTrpc.formData = baseForm({
        themeId: "default-light",
        coverImageUrl: "https://example.com/banner.png",
        settings: {
          themeConfig: {
            colors: {
              background: "#ffffff",
              surface: "#f9fafb",
              foreground: "#111827",
              accent: "#ff0000",
              accentForeground: "#ffffff",
              border: "#e5e7eb",
            },
            fonts: { display: "system-ui, sans-serif", body: "system-ui, sans-serif" },
            shape: { radius: 14, borderWidth: 2 },
          },
          logoUrl: "https://example.com/logo.png",
        },
      });

      const { container } = render(<ThemeDesignPage />);

      const customizeBtn = await screen.findByRole("button", { name: /^customize$/i });
      await act(async () => {
        fireEvent.click(customizeBtn);
      });

      // Expected (Property 2.11): customizer hydrates from persisted settings.themeConfig.
      // Look for any input whose value equals the persisted accent.
      const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement>("input"),
      );
      const accentReflected = inputs.some(
        (i) => (i.value ?? "").toLowerCase() === "#ff0000",
      );
      expect(accentReflected).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.10 Edit case loads defaults — saved theme overrides hydrate on entry", () => {
    it("opening a saved themed form (themeId + settings.themeConfig) hydrates the customizer", async () => {
      mockTrpc.formData = baseForm({
        themeId: "marvel.spiderman",
        settings: {
          themeConfig: {
            colors: {
              background: "#100020",
              surface: "#1a002b",
              foreground: "#fafafa",
              accent: "#dc2626",
              accentForeground: "#ffffff",
              border: "#3a0d52",
            },
            fonts: {
              display: "'Bangers', cursive",
              body: "'Comic Neue', sans-serif",
            },
            shape: { radius: 16, borderWidth: 2 },
          },
        },
      });

      const { container } = render(<ThemeDesignPage />);

      const customizeBtn = await screen.findByRole("button", { name: /^customize$/i });
      await act(async () => {
        fireEvent.click(customizeBtn);
      });

      // Expected (Property 2.12): saved accent is reflected in the customizer on edit-case entry.
      const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement>("input"),
      );
      const accentReflected = inputs.some(
        (i) => (i.value ?? "").toLowerCase() === "#dc2626",
      );
      expect(accentReflected).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("1.11 Stepper labeling — Editor / Design / Preview", () => {
    it("the editor layout renders steps labeled 'Editor', 'Design', 'Preview' in that order", () => {
      mockTrpc.formData = baseForm();
      mockTrpc.pathname = "/dashboard/forms/form-1/fields";

      const { container } = render(
        <FormEditorLayout>
          <div data-testid="step-content" />
        </FormEditorLayout>,
      );

      const nav = container.querySelector('nav[aria-label="Form editor steps"]');
      expect(nav).not.toBeNull();
      const stepButtons = Array.from(
        nav!.querySelectorAll("button"),
      ) as HTMLButtonElement[];
      const labels = stepButtons.map((b) => b.textContent?.replace(/\s+/g, " ").trim() ?? "");

      // Expected (Property 2.13): the three step labels are Editor → Design → Preview.
      expect(labels.some((l) => /Editor/.test(l))).toBe(true);
      expect(labels.some((l) => /Design/.test(l))).toBe(true);
      expect(labels.some((l) => /Preview/.test(l))).toBe(true);

      // Expected: NO step is labeled "Build" (the unfixed label).
      expect(labels.some((l) => /Build/.test(l))).toBe(false);
    });

    it("visiting /settings does NOT light up any step in the stepper", () => {
      mockTrpc.formData = baseForm();
      mockTrpc.pathname = "/dashboard/forms/form-1/settings";

      const { container } = render(
        <FormEditorLayout>
          <div data-testid="step-content" />
        </FormEditorLayout>,
      );

      const nav = container.querySelector('nav[aria-label="Form editor steps"]');
      expect(nav).not.toBeNull();
      const stepButtons = Array.from(
        nav!.querySelectorAll("button"),
      ) as HTMLButtonElement[];

      // The unfixed layout treats /settings as part of the "build" step,
      // so the first step button gets the active class `bg-foreground text-background`.
      // Expected (Property 2.13): /settings activates no step at all.
      const someActive = stepButtons.some((b) =>
        /\bbg-foreground\b/.test(b.className) && /\btext-background\b/.test(b.className),
      );
      expect(someActive).toBe(false);
    });
  });
});
