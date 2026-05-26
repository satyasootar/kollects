import { render, screen } from "@testing-library/react";
import CreateFormPage from "../dashboard/forms/new/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock @repo/database
vi.mock("@repo/database", () => ({
  createFormSchema: {
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data }),
    _def: { typeName: "ZodObject" },
    shape: { title: {}, description: {} },
  },
}));

// Mock tRPC
const mockCreateMutate = vi.fn();
const mockTemplateQuery = vi.fn();

vi.mock("~/trpc/client", () => ({
  trpc: {
    template: {
      listSystem: { useQuery: (...args: any[]) => mockTemplateQuery(...args) },
    },
    form: {
      create: {
        useMutation: (opts: any) => ({
          mutate: (...args: any[]) => {
            mockCreateMutate(...args);
            opts?.onSuccess?.({ id: "new-form-id" });
          },
          isPending: false,
        }),
      },
    },
  },
}));

// Mock chrome components
vi.mock("~/components/chrome", () => ({
  Doodle: () => <span data-testid="doodle" />,
  EditorialCard: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("~/lib/form-helpers", () => ({
  applyServerFieldErrors: () => false,
}));

vi.mock("~/lib/api-error", () => ({
  handleTrpcError: vi.fn(),
}));

vi.mock("~/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

// Mock @hookform/resolvers/zod to pass through
vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => async (values: any) => ({ values, errors: {} }),
}));

describe("Create Form Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTemplateQuery.mockReturnValue({ data: null, isLoading: false });
  });

  it("renders the title with accent word", () => {
    render(<CreateFormPage />);
    expect(screen.getByText("something")).toBeInTheDocument();
  });

  it("renders title input and description textarea", () => {
    render(<CreateFormPage />);
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  it("Blank form button is present", () => {
    render(<CreateFormPage />);
    expect(screen.getByRole("button", { name: /Blank form/ })).toBeInTheDocument();
  });

  it("Cancel link navigates to /dashboard", () => {
    render(<CreateFormPage />);
    const cancel = screen.getByRole("link", { name: /Cancel/ });
    expect(cancel).toHaveAttribute("href", "/dashboard");
  });

  it("renders template cards when templates are available", () => {
    mockTemplateQuery.mockReturnValue({
      data: [
        { id: "t1", name: "Contact Form", description: "A simple contact form", category: "general" },
        { id: "t2", name: "Feedback", description: "Collect feedback", category: "general" },
      ],
      isLoading: false,
    });

    render(<CreateFormPage />);
    expect(screen.getByText("Contact Form")).toBeInTheDocument();
    expect(screen.getByText("Feedback")).toBeInTheDocument();
  });

  it("shows loading skeletons while templates load", () => {
    mockTemplateQuery.mockReturnValue({ data: null, isLoading: true });

    const { container } = render(<CreateFormPage />);
    const skeletons = container.querySelectorAll('[class*="rounded-xl"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});
