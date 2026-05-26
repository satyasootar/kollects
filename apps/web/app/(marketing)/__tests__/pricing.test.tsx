import { render, screen } from "@testing-library/react";
import PricingPage from "../pricing/page";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  PLAN_LIMITS: {
    free: { formLimit: 5, responseLimit: 100 },
    pro: { formLimit: 50, responseLimit: 10000 },
    enterprise: { formLimit: -1, responseLimit: -1 },
  },
  USER_PLANS: ["free", "pro", "enterprise"],
}));

describe("Pricing Page", () => {
  it("renders all three plan names", () => {
    render(<PricingPage />);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });

  it("renders Free plan price as $0", () => {
    render(<PricingPage />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("renders Pro plan price as $12", () => {
    render(<PricingPage />);
    expect(screen.getByText("$12")).toBeInTheDocument();
  });

  it("renders Enterprise price as Contact us", () => {
    render(<PricingPage />);
    expect(screen.getByText("Contact us")).toBeInTheDocument();
  });

  it("renders the hero title with 'free' accent word", () => {
    render(<PricingPage />);
    expect(screen.getByText("free")).toBeInTheDocument();
  });

  it("renders FAQ section with at least 6 items", () => {
    render(<PricingPage />);
    const triggers = screen.getAllByRole("button");
    // FAQ accordion triggers are rendered as buttons
    expect(triggers.length).toBeGreaterThanOrEqual(6);
  });

  it("renders Start free CTA linking to /signup", () => {
    render(<PricingPage />);
    const link = screen.getByRole("link", { name: "Start free" });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("renders the subheadline text", () => {
    render(<PricingPage />);
    expect(
      screen.getByText("Pay when you outgrow it. Cancel any time."),
    ).toBeInTheDocument();
  });
});
