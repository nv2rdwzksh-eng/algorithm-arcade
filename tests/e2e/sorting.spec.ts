import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

for (const algorithm of ["Bubble Sort", "Insertion Sort"]) {
  test(`${algorithm} supports reversible steps and exact statistics`, async ({
    page,
  }) => {
    await page
      .getByLabel("Algorithm", { exact: true })
      .selectOption({ label: algorithm });
    await page.getByLabel("Array values").fill("3, 2, 1");
    await page.getByRole("button", { name: "Apply array" }).click();
    await page.getByRole("button", { name: "Next Step", exact: true }).click();
    await expect(page.getByTestId("step-count")).toContainText("1 /");
    await page
      .getByRole("button", { name: "Previous Step", exact: true })
      .click();
    await expect(page.getByTestId("step-count")).toContainText("0 /");
    await expect(page.getByTestId("comparisons")).toHaveText("0");
    await expect(page.getByTestId("writes")).toHaveText("0");
    const timeline = page.getByLabel("Execution step");
    await timeline.focus();
    await page.keyboard.press("End");
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeDisabled();
    await expect(page.locator('.bar-slot[data-state="sorted"]')).toHaveCount(3);
    expect(
      await page
        .locator(".bar-slot")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-value")),
        ),
    ).toEqual(["1", "2", "3"]);
    await expect(page.getByTestId("comparisons")).toHaveText("3");
    await expect(page.getByTestId("swaps")).toHaveText(
      algorithm === "Bubble Sort" ? "3" : "0",
    );
    await expect(page.getByTestId("writes")).toHaveText(
      algorithm === "Bubble Sort" ? "6" : "5",
    );
    await page
      .getByRole("button", { name: "Previous Step", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    expect(
      await page
        .locator(".bar-slot")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-value")),
        ),
    ).toEqual(["3", "2", "1"]);
    await expect(page.getByTestId("writes")).toHaveText("0");
  });
}

test("plays, pauses, changes speed and resets on algorithm changes", async ({
  page,
}) => {
  await page.getByLabel("Speed", { exact: true }).selectOption("10");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByTestId("step-count")).not.toContainText("0 /");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.getByTestId("step-count").textContent();
  await page.waitForTimeout(300);
  await expect(page.getByTestId("step-count")).toHaveText(paused!);
  await page.getByLabel("Algorithm", { exact: true }).selectOption("insertion");
  await expect(page.getByTestId("step-count")).toContainText("0 /");
  await expect(page.getByLabel("Speed", { exact: true })).toHaveValue("10");
});

test("adjusts array size and randomizes while clearing playback", async ({
  page,
}) => {
  const slider = page.getByLabel("Array size");
  await slider.focus();
  await page.keyboard.press("End");
  await expect(page.locator(".bar-slot")).toHaveCount(40);
  await page.getByRole("button", { name: "Next Step", exact: true }).click();
  await page.getByRole("button", { name: "Randomize", exact: true }).click();
  await expect(page.getByTestId("step-count")).toContainText("0 /");
  await expect(page.locator(".bar-slot")).toHaveCount(40);
  await expect(page.getByTestId("comparisons")).toHaveText("0");
});

test("validates input and handles empty and duplicate arrays", async ({
  page,
}) => {
  const input = page.getByLabel("Array values");
  await input.fill("1,,2");
  await page.getByRole("button", { name: "Apply array" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await input.fill("2, 2, 1");
  await page.getByRole("button", { name: "Apply array" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".bar-slot")).toHaveCount(3);
  await input.fill("");
  await input.press("Enter");
  await expect(page.locator(".bar-slot")).toHaveCount(0);
  await page.getByRole("button", { name: "Next Step", exact: true }).click();
  await expect(page.getByTestId("explanation")).toContainText(
    "Sorting complete",
  );
});

test("insertion highlights the held key and shifts before placing it", async ({
  page,
}) => {
  await page.getByLabel("Algorithm", { exact: true }).selectOption("insertion");
  await page.getByLabel("Array values").fill("3, 2");
  await page.getByRole("button", { name: "Apply array" }).click();
  const next = page.getByRole("button", { name: "Next Step", exact: true });
  await next.click();
  await expect(page.locator(".held-key")).toContainText("2");
  await next.click();
  await expect(page.locator(".held-comparing")).toBeVisible();
  await expect(page.locator('.bar-slot[data-state="comparing"]')).toHaveCount(
    1,
  );
  await next.click();
  await expect(page.getByTestId("writes")).toHaveText("1");
  expect(
    await page
      .locator(".bar-slot")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-value")),
      ),
  ).toEqual(["3", "3"]);
  await page
    .getByRole("button", { name: "Previous Step", exact: true })
    .click();
  await expect(page.getByTestId("writes")).toHaveText("0");
  expect(
    await page
      .locator(".bar-slot")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-value")),
      ),
  ).toEqual(["3", "2"]);
});

test("renders without overflow or browser errors", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("sorting-lab.png"),
    fullPage: true,
  });
});
