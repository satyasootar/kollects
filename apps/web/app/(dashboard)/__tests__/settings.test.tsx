import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockAuthMe = vi.fn();
vi.mock("~/trpc/client", () => ({
  trpc: {
    auth: { me: { useQuery: (...args: any[]) => mockAuthMe(...args) } },
  },
}));

vi.mock("@repo/database/constants/user-plan", () => ({
  PLAN_LIMITS: {
    free: { formLimit: 5, responseLimit: 100 },
    pro: { formLimit: 50, responseLimit: 10000 },
    enterprise: { formLimit: -1, responseLimit: -1 },
  },
}));

vi.mock("~/components/chrome", () => ({
  EditorialCard: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("~/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import AccountSettingsPage from "../dashboard/settings/page";

describe("Account Settings Page", () => {
  it("renders profile section with user data", () => {
    mockAuthMe.mockReturnValue({
      data: { name: "Test User", email: "test@example.com", plan: "free" },
      isLoading: false,
    });
    render(<AccountSettingsPage />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
  });

  it("renders plan section with upgrade button for free plan", () => {
    mockAuthMe.mockReturnValue({ data: { plan: "free" }, isLoading: false });
    render(<AccountSettingsPage />);
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/pricing");
  });

  it("does not show upgrade for enterprise plan", () => {
    mockAuthMe.mockReturnValue({ data: { plan: "enterprise" }, isLoading: false });
    render(<AccountSettingsPage />);
    expect(screen.queryByRole("link", { name: "Upgrade" })).not.toBeInTheDocument();
  });

  it("renders security section with reset password link", () => {
    mockAuthMe.mockReturnValue({ data: { plan: "free" }, isLoading: false });
    render(<AccountSettingsPage />);
    expect(screen.getByText("Security")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset password" })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });
});
