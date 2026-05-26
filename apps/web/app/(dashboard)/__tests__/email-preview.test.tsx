import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ formId: "form-1" }),
}));

// Mock tRPC
const mockEmailGet = vi.fn();
const mockFormGetById = vi.fn();

vi.mock("~/trpc/client", () => ({
  trpc: {
    emailSettings: {
      get: { useQuery: (...args: any[]) => mockEmailGet(...args) },
      update: { useMutation: (opts: any) => ({ mutate: vi.fn(), isPending: false }) },
    },
    form: {
      getById: { useQuery: (...args: any[]) => mockFormGetById(...args) },
    },
    useUtils: () => ({ emailSettings: { get: { invalidate: vi.fn() } } }),
  },
}));

vi.mock("@repo/database/schemas/email-settings", () => ({
  updateEmailSettingsSchema: { parse: (d: any) => d, safeParse: (d: any) => ({ success: true, data: d }), shape: {} },
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => async (values: any) => ({ values, errors: {} }),
}));

vi.mock("~/components/chrome", () => ({
  EditorialCard: ({ children }: any) => <div data-testid="editorial-card">{children}</div>,
}));

vi.mock("~/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("~/lib/api-error", () => ({
  handleTrpcError: vi.fn(),
}));

import EmailSettingsPage from "../dashboard/forms/[formId]/email-settings/page";
import PreviewPage from "../dashboard/forms/[formId]/preview/page";

describe("Email Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormGetById.mockReturnValue({ data: { fields: [] }, isLoading: false });
  });

  it("renders creator notification section", () => {
    mockEmailGet.mockReturnValue({
      data: { creatorNotifyOnSubmission: false },
      isLoading: false,
    });

    render(<EmailSettingsPage />);
    expect(screen.getByText("Creator notifications")).toBeInTheDocument();
  });

  it("renders respondent confirmation section", () => {
    mockEmailGet.mockReturnValue({
      data: { respondentConfirmationEnabled: false },
      isLoading: false,
    });

    render(<EmailSettingsPage />);
    expect(screen.getByText("Respondent confirmation")).toBeInTheDocument();
  });

  it("renders weekly digest section", () => {
    mockEmailGet.mockReturnValue({
      data: { weeklyDigestEnabled: false },
      isLoading: false,
    });

    render(<EmailSettingsPage />);
    expect(screen.getByText("Weekly digest")).toBeInTheDocument();
  });

  it("renders save button", () => {
    mockEmailGet.mockReturnValue({ data: {}, isLoading: false });

    render(<EmailSettingsPage />);
    expect(screen.getByRole("button", { name: /Save settings/ })).toBeInTheDocument();
  });
});

describe("Preview Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders preview mode banner", () => {
    mockFormGetById.mockReturnValue({
      data: { slug: "my-form" },
      isLoading: false,
    });

    render(<PreviewPage />);
    expect(screen.getByText(/Preview mode/)).toBeInTheDocument();
  });

  it("renders iframe with correct src when slug exists", () => {
    mockFormGetById.mockReturnValue({
      data: { slug: "test-form" },
      isLoading: false,
    });

    render(<PreviewPage />);
    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("src", "/f/test-form?preview=true");
  });

  it("shows message when no slug is set", () => {
    mockFormGetById.mockReturnValue({
      data: { slug: null },
      isLoading: false,
    });

    render(<PreviewPage />);
    expect(screen.getByText(/Set a slug in Settings/)).toBeInTheDocument();
  });

  it("renders device toggle buttons", () => {
    mockFormGetById.mockReturnValue({
      data: { slug: "my-form" },
      isLoading: false,
    });

    render(<PreviewPage />);
    expect(screen.getByLabelText("Desktop")).toBeInTheDocument();
    expect(screen.getByLabelText("Tablet")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile")).toBeInTheDocument();
  });
});
