import { test, expect } from "@playwright/test";

test.describe("TC-UI-002 | Resilience | Partial API Failure Graceful Degradation", () => {
  test("dashboard remains usable even if analytics API returns 500", async ({ page }) => {
    // Intercept and ABORT the analytics request
    await page.route("**/trpc/analytics.getDaily**", async (route) => {
      await route.abort("failed");
    });

    // We mock the forms list to succeed so the rest of the dashboard loads
    await page.route("**/trpc/form.list**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { result: { data: [{ id: "form-1", title: "My Form" }] } },
      });
    });

    await page.goto("/dashboard");

    // EXPECTATION 1: The main dashboard and form list should STILL render completely
    await expect(page.getByText("My Form")).toBeVisible();
    await expect(page.getByTestId("dashboard-header")).toBeVisible();

    // EXPECTATION 2: The analytics widget gracefully degrades with an Error Boundary UI
    const analyticsWidget = page.getByTestId("analytics-widget");
    await expect(analyticsWidget).toContainText("Failed to load statistics");

    // We expect a retry button to be present instead of a full white-screen-of-death
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });
});
