import { render, screen } from "@testing-library/react";
import ExplorePage from "../explore/page";

// Mock the tRPC client
vi.mock("~/trpc/client", () => {
  const mockUseInfiniteQuery = vi.fn();
  return {
    trpc: {
      publicExplore: {
        list: {
          useInfiniteQuery: mockUseInfiniteQuery,
        },
      },
    },
  };
});

// Mock the chrome components that use browser APIs or images
vi.mock("~/components/chrome", () => ({
  DotField: () => <div data-testid="dot-field" />,
  Doodle: ({ children, ...props }: any) => <span data-testid="doodle" {...props}>{children}</span>,
  EditorialCard: ({ children, className }: any) => <div data-testid="editorial-card" className={className}>{children}</div>,
  EmptyState: ({ headline, description, action }: any) => (
    <div data-testid="empty-state">
      <h2>{headline}</h2>
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  ),
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
}));

// Import the mocked trpc to control return values
import { trpc } from "~/trpc/client";

describe("Explore Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeletons when loading", () => {
    const mock = trpc.publicExplore.list.useInfiniteQuery as any;
    mock.mockReturnValue({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: true,
      isError: false,
    });

    const { container } = render(<ExplorePage />);
    // Should render 6 skeleton cards
    const skeletons = container.querySelectorAll('[class*="rounded-2xl"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });

  it("renders empty state when no forms exist", () => {
    const mock = trpc.publicExplore.list.useInfiniteQuery as any;
    mock.mockReturnValue({
      data: { pages: [{ items: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    });

    render(<ExplorePage />);
    expect(screen.getByText(/No public forms yet/)).toBeInTheDocument();
  });

  it("renders form cards when data is available", () => {
    const mock = trpc.publicExplore.list.useInfiniteQuery as any;
    mock.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              { id: "1", title: "Feedback Form", slug: "feedback", description: "A test form", status: "published", submissionCount: 42 },
              { id: "2", title: "Survey", slug: "survey", description: "Another form", status: "published", submissionCount: 10 },
            ],
          },
        ],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    });

    render(<ExplorePage />);
    expect(screen.getByText("Feedback Form")).toBeInTheDocument();
    expect(screen.getByText("Survey")).toBeInTheDocument();
    expect(screen.getByText("42 responses")).toBeInTheDocument();
  });

  it("renders the hero title with accent word", () => {
    const mock = trpc.publicExplore.list.useInfiniteQuery as any;
    mock.mockReturnValue({
      data: { pages: [{ items: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    });

    render(<ExplorePage />);
    expect(screen.getByText("worth filling")).toBeInTheDocument();
  });

  it("renders filter chips", () => {
    const mock = trpc.publicExplore.list.useInfiniteQuery as any;
    mock.mockReturnValue({
      data: { pages: [{ items: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    });

    render(<ExplorePage />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("renders error state on error", () => {
    const mock = trpc.publicExplore.list.useInfiniteQuery as any;
    mock.mockReturnValue({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: true,
    });

    render(<ExplorePage />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("links form cards to /f/{slug}", () => {
    const mock = trpc.publicExplore.list.useInfiniteQuery as any;
    mock.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              { id: "1", title: "My Form", slug: "my-form", status: "published", submissionCount: 5 },
            ],
          },
        ],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    });

    render(<ExplorePage />);
    const link = screen.getByRole("link", { name: /My Form/ });
    expect(link).toHaveAttribute("href", "/f/my-form");
  });
});
