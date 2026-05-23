import { test, expect } from "@playwright/test";

test.describe("TC-USR-001 | Submissions | The 'Double-Click' Submission", () => {
  test("submitting a form rapidly multiple times only sends one network request", async ({ page }) => {
    // Navigate to a public form submission page
    await page.goto("/f/public-form-123");

    // Track network requests to the submission endpoint
    let submitRequestCount = 0;
    await page.route("**/api/submit**", async (route) => {
      submitRequestCount++;
      // Simulate network delay to give user time to double click
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Fill out the required inputs
    await page.getByLabel("Email").fill("test@example.com");

    const submitBtn = page.getByRole("button", { name: "Submit" });

    // User impatiently double clicks
    await submitBtn.click();
    await submitBtn.click({ force: true }); // Force click in case UI disables it immediately
    await submitBtn.click({ force: true });

    // Wait for the route to finish resolving
    await page.waitForTimeout(1000);

    // EXPECTATION: Button disables immediately after first click
    await expect(submitBtn).toBeDisabled();

    // EXPECTATION: Even with forced clicks, the frontend logic prevents duplicate dispatches
    expect(submitRequestCount).toBe(1);
  });
});

test.describe("TC-USR-002 | Multi-Tab | Cross-Tab Authentication State", () => {
  test("logging out in Tab A redirects unauthorized requests in Tab B to login", async ({ context }) => {
    // Tab A: Log in
    const pageA = await context.newPage();
    await pageA.goto("/dashboard");
    
    // Setup a mock to represent "we are logged in" initially
    await pageA.route("**/trpc/auth.me**", async route => {
      await route.fulfill({ status: 200, json: { result: { data: { id: "user-1" } } } });
    });

    // Tab B: Open a protected form builder
    const pageB = await context.newPage();
    await pageB.goto("/builder/form-1");
    // Tab B assumes it is logged in as well
    await expect(pageB.getByText("Form Builder")).toBeVisible();

    // Tab A: Log out
    await pageA.getByRole("button", { name: "Logout" }).click();
    
    // Now any subsequent requests should return 401 Unauthorized
    await pageB.route("**/trpc/**", async route => {
      await route.fulfill({ status: 401, json: { error: { message: "UNAUTHORIZED" } } });
    });

    // Tab B: User tries to save their form
    await pageB.getByRole("button", { name: "Save Changes" }).click();

    // EXPECTATION: Tab B frontend globally catches 401 and forces redirect
    await pageB.waitForURL("**/login*");
    await expect(pageB.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });
});
