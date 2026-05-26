import { render, screen } from "@testing-library/react";
import { ShareModal } from "~/components/form-builder/share-modal";

// Mock qrcode.react
vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: any) => <div data-testid="qr-code" data-value={value} />,
}));

vi.mock("~/components/chrome", () => ({
  TintCard: ({ children, tint, className }: any) => (
    <div data-testid={`tint-card-${tint}`} className={className}>
      {children}
    </div>
  ),
  StatusBadge: ({ status }: any) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

vi.mock("~/lib/toast", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

describe("ShareModal", () => {
  it("renders the form URL with slug", () => {
    render(
      <ShareModal
        open={true}
        onOpenChange={() => {}}
        slug="my-form"
        status="published"
        visibility="public"
      />,
    );
    const input = screen.getByDisplayValue(/\/f\/my-form/);
    expect(input).toBeInTheDocument();
  });

  it("shows warning when form is draft", () => {
    render(
      <ShareModal
        open={true}
        onOpenChange={() => {}}
        slug="my-form"
        status="draft"
        visibility="public"
      />,
    );
    expect(
      screen.getByText(/Publish this form before sharing/),
    ).toBeInTheDocument();
  });

  it("does not show warning when form is published", () => {
    render(
      <ShareModal
        open={true}
        onOpenChange={() => {}}
        slug="my-form"
        status="published"
        visibility="public"
      />,
    );
    expect(
      screen.queryByText(/Publish this form before sharing/),
    ).not.toBeInTheDocument();
  });

  it("renders QR code with the form URL", () => {
    render(
      <ShareModal
        open={true}
        onOpenChange={() => {}}
        slug="test-slug"
        status="published"
        visibility="public"
      />,
    );
    const qr = screen.getByTestId("qr-code");
    expect(qr).toHaveAttribute(
      "data-value",
      expect.stringContaining("/f/test-slug"),
    );
  });

  it("renders visibility badge", () => {
    render(
      <ShareModal
        open={true}
        onOpenChange={() => {}}
        slug="my-form"
        status="published"
        visibility="unlisted"
      />,
    );
    expect(screen.getByTestId("status-badge")).toHaveTextContent("unlisted");
  });
});
