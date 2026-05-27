import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "~/components/ui/button";
import { EditorialCard, SurfaceCard } from "../editorial-card";
import {
  UnderlineTabs,
  UnderlineTabsList,
  UnderlineTabsTrigger,
  UnderlineTabsContent,
} from "../underline-tabs";

describe("Button variants (DESIGN.md §3.1)", () => {
  it("renders forest variant with correct classes", () => {
    render(<Button variant="forest">Publish</Button>);
    const btn = screen.getByRole("button", { name: "Publish" });
    expect(btn.className).toContain("bg-foreground");
    expect(btn.className).toContain("text-background");
    expect(btn.className).toContain("rounded-full");
  });

  it("renders chip variant with rounded-full", () => {
    render(
      <Button variant="chip" size="chip">
        Filter
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Filter" });
    expect(btn.className).toContain("rounded-full");
    expect(btn.className).toContain("border-border");
  });

  it("renders link-soft variant with underline decoration", () => {
    render(<Button variant="link-soft">Learn more</Button>);
    const btn = screen.getByRole("button", { name: "Learn more" });
    expect(btn.className).toContain("underline");
    expect(btn.className).toContain("decoration-foreground/30");
  });

  it("default variant has active:scale-[0.98]", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn.className).toContain("active:scale-[0.98]");
  });
});

describe("EditorialCard (DESIGN.md §3.3)", () => {
  it("renders with rounded-2xl and border", () => {
    const { container } = render(<EditorialCard>Content</EditorialCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("rounded-2xl");
    expect(div.className).toContain("border-border");
    expect(div.className).toContain("p-6");
  });

  it("adds hover lift classes when interactive", () => {
    const { container } = render(<EditorialCard interactive>Card</EditorialCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("hover:-translate-y-0.5");
    expect(div.className).toContain("hover:shadow-");
  });

  it("does not add hover lift when not interactive", () => {
    const { container } = render(<EditorialCard>Card</EditorialCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).not.toContain("hover:-translate-y-0.5");
  });
});

describe("SurfaceCard (DESIGN.md §3.3)", () => {
  it("renders with rounded-xl and tighter padding", () => {
    const { container } = render(<SurfaceCard>Data</SurfaceCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("rounded-xl");
    expect(div.className).toContain("p-4");
    expect(div.className).toContain("border-border/80");
  });
});

describe("UnderlineTabs (DESIGN.md §3.11)", () => {
  it("renders tabs with border-b on the list", () => {
    const { container } = render(
      <UnderlineTabs defaultValue="a">
        <UnderlineTabsList>
          <UnderlineTabsTrigger value="a">Tab A</UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="b">Tab B</UnderlineTabsTrigger>
        </UnderlineTabsList>
        <UnderlineTabsContent value="a">Content A</UnderlineTabsContent>
        <UnderlineTabsContent value="b">Content B</UnderlineTabsContent>
      </UnderlineTabs>,
    );
    const list = container.querySelector('[role="tablist"]') as HTMLElement;
    expect(list.className).toContain("border-b");
    expect(list.className).toContain("border-border");
  });

  it("renders trigger with correct styling classes", () => {
    render(
      <UnderlineTabs defaultValue="a">
        <UnderlineTabsList>
          <UnderlineTabsTrigger value="a">Tab A</UnderlineTabsTrigger>
        </UnderlineTabsList>
        <UnderlineTabsContent value="a">Content A</UnderlineTabsContent>
      </UnderlineTabs>,
    );
    const trigger = screen.getByRole("tab", { name: "Tab A" });
    expect(trigger.className).toContain("font-medium");
    expect(trigger.className).toContain("text-muted-foreground");
    expect(trigger.className).toContain("py-3");
  });

  it("renders the sliding indicator span", () => {
    const { container } = render(
      <UnderlineTabs defaultValue="a">
        <UnderlineTabsList>
          <UnderlineTabsTrigger value="a">Tab A</UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="b">Tab B</UnderlineTabsTrigger>
        </UnderlineTabsList>
        <UnderlineTabsContent value="a">Content A</UnderlineTabsContent>
      </UnderlineTabs>,
    );
    const list = container.querySelector('[role="tablist"]') as HTMLElement;
    const indicator = list.querySelector("span.absolute");
    expect(indicator).toBeInTheDocument();
    expect(indicator?.className).toContain("h-[2px]");
    expect(indicator?.className).toContain("bg-foreground");
  });

  it("switches content when clicking a tab", async () => {
    const user = userEvent.setup();
    render(
      <UnderlineTabs defaultValue="a">
        <UnderlineTabsList>
          <UnderlineTabsTrigger value="a">Tab A</UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="b">Tab B</UnderlineTabsTrigger>
        </UnderlineTabsList>
        <UnderlineTabsContent value="a">Content A</UnderlineTabsContent>
        <UnderlineTabsContent value="b">Content B</UnderlineTabsContent>
      </UnderlineTabs>,
    );
    expect(screen.getByText("Content A")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Tab B" }));
    expect(screen.getByText("Content B")).toBeVisible();
  });
});
