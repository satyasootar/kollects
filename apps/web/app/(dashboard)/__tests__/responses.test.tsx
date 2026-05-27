import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ formId: "form-1", responseId: "resp-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock tRPC
const mockResponseList = vi.fn();
const mockResponseGetById = vi.fn();

vi.mock("~/trpc/client", () => ({
  trpc: {
    response: {
      list: { useQuery: (...args: any[]) => mockResponseList(...args) },
      getById: { useQuery: (...args: any[]) => mockResponseGetById(...args) },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    useUtils: () => ({ response: { list: { invalidate: vi.fn() } } }),
  },
}));

vi.mock("~/components/chrome", () => ({
  EmptyState: ({ headline }: any) => <div data-testid="empty-state">{headline}</div>,
  EditorialCard: ({ children }: any) => <div>{children}</div>,
  SurfaceCard: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("~/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("~/lib/api-error", () => ({
  handleTrpcError: vi.fn(),
}));

import ResponsesPage from "../dashboard/forms/[formId]/responses/page";

describe("Responses Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponseGetById.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("renders empty state when no responses", () => {
    mockResponseList.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
    });

    render(<ResponsesPage />);
    expect(screen.getByText("No responses yet.")).toBeInTheDocument();
  });

  it("renders response count header", () => {
    mockResponseList.mockReturnValue({
      data: {
        items: [
          {
            id: "r1",
            createdAt: new Date().toISOString(),
            completionTimeSeconds: 45,
            respondentEmail: "test@example.com",
            ipHash: "abc12345def",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    render(<ResponsesPage />);
    expect(screen.getByText("1 response")).toBeInTheDocument();
  });

  it("renders table rows for responses", () => {
    mockResponseList.mockReturnValue({
      data: {
        items: [
          {
            id: "r1",
            createdAt: new Date().toISOString(),
            completionTimeSeconds: 61,
            respondentEmail: "user@test.com",
            ipHash: "abcdef1234567890",
          },
          {
            id: "r2",
            createdAt: new Date().toISOString(),
            completionTimeSeconds: 30,
            respondentEmail: null,
            ipHash: null,
          },
        ],
        total: 2,
      },
      isLoading: false,
    });

    render(<ResponsesPage />);
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
    expect(screen.getByText("1m 1s")).toBeInTheDocument();
    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(screen.getByText("abcdef12…")).toBeInTheDocument();
  });

  it("renders Export CSV button", () => {
    mockResponseList.mockReturnValue({
      data: { items: [{ id: "r1", createdAt: new Date().toISOString() }], total: 1 },
      isLoading: false,
    });

    render(<ResponsesPage />);
    expect(screen.getByRole("button", { name: /Export CSV/ })).toBeInTheDocument();
  });

  it("formats completion time correctly", () => {
    mockResponseList.mockReturnValue({
      data: {
        items: [
          { id: "r1", createdAt: new Date().toISOString(), completionTimeSeconds: 125 },
        ],
        total: 1,
      },
      isLoading: false,
    });

    render(<ResponsesPage />);
    expect(screen.getByText("2m 5s")).toBeInTheDocument();
  });
});
