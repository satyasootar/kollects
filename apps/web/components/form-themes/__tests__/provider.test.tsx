import { render } from "@testing-library/react";
import { FormThemeProvider } from "../_provider";
import { DEFAULT_LIGHT_THEME } from "../_registry";

describe("FormThemeProvider", () => {
  it("renders children with data-theme attribute", () => {
    const { container } = render(
      <FormThemeProvider theme={DEFAULT_LIGHT_THEME}>
        <div data-testid="child">Hello</div>
      </FormThemeProvider>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("data-theme", "default-light");
  });

  it("sets data-color-scheme attribute", () => {
    const { container } = render(
      <FormThemeProvider theme={DEFAULT_LIGHT_THEME}>
        <div>Test</div>
      </FormThemeProvider>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("data-color-scheme", "light");
  });

  it("injects CSS variables as inline styles", () => {
    const { container } = render(
      <FormThemeProvider theme={DEFAULT_LIGHT_THEME}>
        <div>Test</div>
      </FormThemeProvider>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--theme-bg")).toBe("#ffffff");
    expect(wrapper.style.getPropertyValue("--theme-accent")).toBe("#0d2e2a");
    expect(wrapper.style.getPropertyValue("--theme-radius")).toBe("10px");
  });

  it("sets data-question-layout attribute", () => {
    const { container } = render(
      <FormThemeProvider theme={DEFAULT_LIGHT_THEME}>
        <div>Test</div>
      </FormThemeProvider>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("data-question-layout", "card-stack");
  });
});
