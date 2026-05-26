import { render, screen } from "@testing-library/react";
import DashboardPage from "../dashboard/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock @repo/database
vi.mock("@repo/database", () => ({
  PLAN_LIMITS: {
    free: { formLimit: 5, responseLimit: 100 },
    pro: { formLimit: 50, responseLimit: 10000 },
    enterprise: { formLimit: -1, responseLimit: -1 },
  },
}));

// Mock tRPC
const mockFormList = vi.fn();
const mockAuthMe = vi.fn();

vi.mock("~/trpc/client", () => ({
  trpc: {
    auth: { me: { useQuery: (...args: any[]) => mockAuthMe(...args) } },
    form: {
      list: { useQuery: (...args: any[]) => mockFormList(...args) },
      publish: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      unpublish: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      archive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      clone: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    useUtils: () => ({ form: { list: { invalidate: vi.fn() } } }),
  },
}));

// Mock chrome components
vi.mock("~/components/chrome", () => ({
  TintCard: Object.assign(
    ({ children, tint, className }: any) => (
      <div data-testid={`tint-card-${tint}`} className={className}>{children}</div>
    ),
    {
      Number: ({ children }: any) => <div data-testid="tint-number">{children}</div>,
      Caption: ({ children }: any) => <p data-testid="tint-caption">{children}</p>,
    },
  ),
  NumberTicker: ({ value, suffix }: any) => <span>{value}{suffix ?? ""}</span>,
  Doodle: () => <span data-testid="doodle" />,
  EditorialCard: ({ children, className }: any) => (
    <div data-testid="editorial-card" className={className}>{children}</div>
  ),
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
  EmptyState: ({ headline, description, action }: any) => (
    <div data-testid="empty-state">
      <h2>{headline}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  ),
}));

// Mock UI components
vi.mock("~/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("~/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

vi.mock("~/components/ui/context-menu", () => ({
  ContextMenu: ({ children }: any) => <div>{children}</div>,
  ContextMenuContent: ({ children }: any) => <div>{children}</div>,
  ContextMenuItem: ({ children }: any) => <div>{children}</div>,
  ContextMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("~/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children }: any) => <button>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("~/components/ui/toggle-group", () => ({
  ToggleGroup: ({ children }: any) => <div data-testid="toggle-group">{children}</div>,
  ToggleGroupItem: ({ children, value }: any) => (
    <button data-testid={`toggle-${value}`}>{children}</button>
  ),
}));

vi.mock("~/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthMe.mockReturnValue({ data: { plan: "free" } });
  });

  it("renders empty state when no forms exist", () => {
    mockFormList.mockReturnValue({ data: [], isLoading: false });

    render(<DashboardPage />);
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders form cards when forms exist", () => {
    mockFormList.mockReturnValue({
      data: [
        { id: "1", title: "My Form", status: "published", submissionCount: 10, viewCount: 50, startCount: 20 },
        { id: "2", title: "Draft Form", status: "draft", submissionCount: 0, viewCount: 0, startCount: 0 },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);
    expect(screen.getByText("My Form")).toBeInTheDocument();
    expect(screen.getByText("Draft Form")).toBeInTheDocument();
  });

  it("renders plan limit warning when near limit", () => {
    mockAuthMe.mockReturnValue({ data: { plan: "free" } });
    mockFormList.mockReturnValue({
      data: [
        { id: "1", title: "Form 1", status: "published", submissionCount: 0 },
        { id: "2", title: "Form 2", status: "published", submissionCount: 0 },
        { id: "3", title: "Form 3", status: "published", submissionCount: 0 },
        { id: "4", title: "Form 4", status: "published", submissionCount: 0 },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);
    expect(screen.getByText(/Almost full/)).toBeInTheDocument();
    expect(screen.getByText(/4 of 5/)).toBeInTheDocument();
  });

  it("does not show limit warning for enterprise plan", () => {
    mockAuthMe.mockReturnValue({ data: { plan: "enterprise" } });
    mockFormList.mockReturnValue({
      data: Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        title: `Form ${i}`,
        status: "published",
        submissionCount: 0,
      })),
      isLoading: false,
    });

    render(<DashboardPage />);
    expect(screen.queryByText(/Almost full/)).not.toBeInTheDocument();
  });

  it("renders the page title with accent word", () => {
    mockFormList.mockReturnValue({ data: [], isLoading: false });

    render(<DashboardPage />);
    expect(screen.getByText("one")).toBeInTheDocument();
  });

  it("renders stats row with 4 tint cards", () => {
    mockFormList.mockReturnValue({
      data: [
        { id: "1", title: "Form", status: "published", submissionCount: 42, completionRate: 80 },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);
    expect(screen.getByTestId("tint-card-mint")).toBeInTheDocument();
    expect(screen.getByTestId("tint-card-peach")).toBeInTheDocument();
    expect(screen.getByTestId("tint-card-forest")).toBeInTheDocument();
    expect(screen.getByTestId("tint-card-butter")).toBeInTheDocument();
  });

  it("renders loading skeletons when loading", () => {
    mockFormList.mockReturnValue({ data: undefined, isLoading: true });

    render(<DashboardPage />);
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBe(6);
  });
});
