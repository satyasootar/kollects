import { test, expect } from "@playwright/test";

test.describe("TC-UI-001 | React State | Stale Closure in Form Builder Drag-and-Drop", () => {
  test("drag and drop field should update local UI immediately while auto-save resolves in background", async ({ page }) => {
    // Navigate to a mocked form builder page
    await page.goto("/builder/form-1");

    // We can simulate network delay to represent "auto-save is resolving"
    await page.route("**/trpc/form.update**", async (route) => {
      // Simulate slow save
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ status: 200, json: { result: { data: { success: true } } } });
    });

    // In a real scenario we'd target actual draggable locators.
    // For this test suite setup, we assume data-testid locators are present.
    const field1 = page.getByTestId("draggable-field-1");
    const dropZone5 = page.getByTestId("drop-zone-5");

    // Perform the drag and drop
    await field1.dragTo(dropZone5);

    // EXPECTATION 1: The UI updates IMMEDIATELY before the network request finishes
    await expect(page.getByTestId("field-order-indicator")).toHaveText("Field 1 is at Position 5");

    // EXPECTATION 2: We wait for the request to ensure it fired
    const requestPromise = page.waitForRequest(req => req.url().includes("form.update"));
    const req = await requestPromise;
    expect(req.method()).toBe("POST");
    
    // The state should remain stable and not rollback due to hydration issues
    await expect(page.getByTestId("field-order-indicator")).toHaveText("Field 1 is at Position 5");
  });
});
