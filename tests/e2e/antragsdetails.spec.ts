import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("renders antragsdetails, passes axe and navigates after autosave", async ({ page }) => {
  await page.goto("/de/forms/hausanschluss-demo/antragsdetails");

  await expect(page.getByRole("heading", { name: "Antragsdetails" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Stadtwerke Kundenportal" })).toBeVisible();

  const axeResults = await new AxeBuilder({ page }).analyze();
  const blockingViolations = axeResults.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));

  expect(blockingViolations).toEqual([]);

  await page.getByLabel("Strom").check();
  await page.getByLabel("Änderung").check();
  await page.getByLabel("Art der Veränderung").selectOption("anlagen_erweiterung");
  await page.getByLabel("Wunschtermin").fill("2026-03-20");
  await page.getByLabel("Nachricht").fill("Bitte Rückmeldung per E-Mail.");
  await page.getByRole("button", { name: "Weiter" }).click();

  await expect(page).toHaveURL(/\/anschlussort\?applicationId=/);
  await expect(page.getByRole("heading", { name: "Nächster Schritt: Anschlussort" })).toBeVisible();
});

test("shows validation summary when required fields are missing", async ({ page }) => {
  await page.goto("/de/forms/hausanschluss-demo/antragsdetails");
  await page.getByRole("button", { name: "Weiter" }).click();

  const summary = page.locator("section.wizard-summary");

  await expect(summary).toBeVisible();
  await expect(summary.getByText("Wähle mindestens ein Medium aus.")).toBeVisible();
  await expect(summary.getByText("Wähle eine Antragsart aus.")).toBeVisible();
  await expect(summary.getByText("Wähle einen Wunschtermin aus.")).toBeVisible();
});
