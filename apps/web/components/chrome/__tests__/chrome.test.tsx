import { render, screen } from "@testing-library/react";
import { Doodle } from "../doodle";
import { TintCard } from "../tint-card";
import { NumberTicker } from "../number-ticker";
import { StatusBadge } from "../status-badge";
import { EmptyState } from "../empty-state";

describe("Doodle", () => {
  it("renders with aria-hidden=true by default (decorative)", () => {
    const { container } = render(<Doodle name="sparkle" />);
    const span = container.firstChild as HTMLElement;
    expect(span).toHaveAttribute("aria-hidden", "true");
  });

  it("renders with correct img src", () => {
    render(<Doodle name="arrow-loop" />);
    const img = screen.getByRole("presentation", { hidden: true }) || document.querySelector("img");
    expect(document.querySelector("img")).toHaveAttribute("src", "/doodles/arrow-loop.svg");
  });

  it("sets aria-hidden=false when decorative=false", () => {
    const { container } = render(<Doodle name="sparkle" decorative={false} />);
    const span = container.firstChild as HTMLElement;
    expect(span).toHaveAttribute("aria-hidden", "false");
  });

  it("applies text-doodle and opacity-80 classes", () => {
    const { container } = render(<Doodle name="swirl" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("text-doodle");
    expect(span.className).toContain("opacity-80");
  });
});

describe("TintCard", () => {
  it.each([
    ["mint", "bg-tint-mint", "text-tint-mint-ink"],
    ["peach", "bg-tint-peach", "text-tint-peach-ink"],
    ["blush", "bg-tint-blush", "text-tint-blush-ink"],
    ["butter", "bg-tint-butter", "text-tint-butter-ink"],
    ["sky", "bg-tint-sky", "text-tint-sky-ink"],
    ["lilac", "bg-tint-lilac", "text-tint-lilac-ink"],
    ["forest", "bg-foreground", "text-background"],
  ] as const)("renders %s tint with correct classes", (tint, bgClass, textClass) => {
    const { container } = render(<TintCard tint={tint}>Content</TintCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain(bgClass);
    expect(div.className).toContain(textClass);
    expect(div.className).toContain("rounded-3xl");
    expect(div.className).toContain("p-6");
  });

  it("applies span prop for grid layout", () => {
    const { container } = render(<TintCard tint="mint" span="col-span-2">X</TintCard>);
    expect((container.firstChild as HTMLElement).className).toContain("col-span-2");
  });
});

describe("NumberTicker", () => {
  it("renders final value immediately when reduced motion is preferred", () => {
    // Mock matchMedia to return matches: true for reduced motion
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { container } = render(<NumberTicker value={42} suffix="%" />);
    expect(container.textContent).toBe("42%");

    // Reset matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });
});

describe("StatusBadge", () => {
  it.each(["draft", "published", "archived", "public", "unlisted", "private"] as const)(
    "renders %s variant with dot prefix",
    (status) => {
      const { container } = render(<StatusBadge status={status} />);
      // Check the dot element exists
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("rounded-full");
      // Check the status text
      expect(container.textContent).toContain(status);
    },
  );
});

describe("EmptyState", () => {
  it("renders headline and description", () => {
    render(<EmptyState headline="Nothing here" description="Create something" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Create something")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    render(
      <EmptyState headline="Empty" action={<button>Create</button>} />,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders without illustration when not provided", () => {
    const { container } = render(<EmptyState headline="Test" />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});
