import { expect, test } from "@playwright/test";

test("@smoke redirects unauthenticated root access to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("@smoke renders login form fields", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByLabel("Water Company")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
});

test("@phaseg enforces company-first login progression", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByLabel("Water Company")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveCount(0);

  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change company" })).toBeVisible();
});

test("@phaseg redirects protected connection and dashboard edit routes", async ({ page }) => {
  const protectedRoutes = [
    "/map",
    "/meter-reader/pressure",
    "/meter-reader/submit",
    "/admin/accounts",
    "/admin/accounts/ACC-1001",
  ];

  for (const route of protectedRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  }
});

test("@phaseg renders company-context-required login reason", async ({ page }) => {
  await page.goto("/login?reason=company-context-required");

  await expect(
    page.getByText("Select your water company and sign in again to continue.")
  ).toBeVisible();
});
