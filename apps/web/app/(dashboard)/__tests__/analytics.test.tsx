import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ formId: "form-1" }),
}));

// Mock recharts to avoid canvas issues in jsdom
vi.mock("recharts", () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// Mock tRPC
const mockOverview = vi.fn();
const mockDailyStats = vi.fn();
const mockDropoffs = vi.fn();
const mockFormGetById = vi.fn();
const mockFieldStats = vi.fn();

vi.mock("~/trpc/client", () => ({
  trpc: {
    analytics: {
      getOverview: { useQuery: (...args: any[]) => mockOverview(...args) },
      getDailyStats: { useQuery: (...args: any[]) => mockDailyStats(...args) },
      getDropoffByPage: { useQuery: (...args: any[]) => mockDropoffs(...args) },
      getFieldStats: { useQuery: (...args: any[]) => mockFieldStats(...args) },
    },
    form: {
      getById: { useQuery: (...args: any[]) => mockFormGetById(...args) },
    },
  },
}));

vi.mock("~/components/chrome", () => ({
  TintCard: Object.assign(
    ({ children, tint }: any) => <div data-testid={`tint-card-${tint}`}>{children}</div>,
    {
      Number: ({ children }: any) => <div data-testid="tint-number">{children}</div>,
      Caption: ({ children }: any) => <p data-testid="tint-caption">{children}</p>,
    },
  ),
  NumberTicker: ({ value, suffix }: any) => (
    <span>
      {value}
      {suffix ?? ""}
    </span>
  ),
  Doodle: () => <span data-testid="doodle" />,
  EditorialCard: ({ children }: any) => <div data-testid="editorial-card">{children}</div>,
  EmptyState: ({ headline }: any) => <div data-testid="empty-state">{headline}</div>,
}));

import AnalyticsPage from "../dashboard/forms/[formId]/analytics/page";

describe("Analytics Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormGetById.mockReturnValue({ data: { fields: [] }, isLoading: false });
    mockDropoffs.mockReturnValue({ data: [], isLoading: false });
    mockFieldStats.mockReturnValue({ data: null, isLoading: false });
  });

  it("renders 4 overview tiles when data is available", () => {
    mockOverview.mockReturnValue({
      data: { totalViews: 100, totalStarts: 80, totalSubmissions: 50, completionRate: 62 },
      isLoading: false,
    });
    mockDailyStats.mockReturnValue({ data: [], isLoading: false });

    render(<AnalyticsPage />);
    expect(screen.getByTestId("tint-card-sky")).toBeInTheDocument();
    expect(screen.getByTestId("tint-card-peach")).toBeInTheDocument();
    expect(screen.getByTestId("tint-card-mint")).toBeInTheDocument();
    expect(screen.getByTestId("tint-card-forest")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("62%")).toBeInTheDocument();
  });

  it("renders loading skeletons when overview is loading", () => {
    mockOverview.mockReturnValue({ data: undefined, isLoading: true });
    mockDailyStats.mockReturnValue({ data: [], isLoading: false });

    const { container } = render(<AnalyticsPage />);
    const skeletons = container.querySelectorAll('[class*="rounded-3xl"]');
    expect(skeletons.length).toBe(4);
  });

  it("renders empty state when no daily data", () => {
    mockOverview.mockReturnValue({ data: { totalViews: 0 }, isLoading: false });
    mockDailyStats.mockReturnValue({ data: [], isLoading: false });

    render(<AnalyticsPage />);
    expect(screen.getByText("Not enough data yet.")).toBeInTheDocument();
  });

  it("renders area chart when daily data exists", () => {
    mockOverview.mockReturnValue({ data: { totalViews: 10 }, isLoading: false });
    mockDailyStats.mockReturnValue({
      data: [
        { date: "2024-01-01", views: 5, starts: 3, submissions: 2 },
        { date: "2024-01-02", views: 8, starts: 6, submissions: 4 },
      ],
      isLoading: false,
    });

    render(<AnalyticsPage />);
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("renders drop-off chart when data exists", () => {
    mockOverview.mockReturnValue({ data: { totalViews: 10 }, isLoading: false });
    mockDailyStats.mockReturnValue({ data: [], isLoading: false });
    mockDropoffs.mockReturnValue({
      data: [
        { page: 1, dropoffs: 10 },
        { page: 2, dropoffs: 5 },
      ],
      isLoading: false,
    });

    render(<AnalyticsPage />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByText("Drop-off by page")).toBeInTheDocument();
  });

  it("renders field selector when form has fields", () => {
    mockOverview.mockReturnValue({ data: { totalViews: 10 }, isLoading: false });
    mockDailyStats.mockReturnValue({ data: [], isLoading: false });
    mockFormGetById.mockReturnValue({
      data: {
        fields: [
          { id: "f1", label: "Email" },
          { id: "f2", label: "Rating" },
        ],
      },
      isLoading: false,
    });

    render(<AnalyticsPage />);
    expect(screen.getByText("Field statistics")).toBeInTheDocument();
  });
});
