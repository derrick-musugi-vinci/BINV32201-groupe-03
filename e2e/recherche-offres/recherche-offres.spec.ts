import { expect, test } from "@playwright/test";

const STUDENT = {
  kind: "STUDENT",
  id: 1,
  firstName: "Étudiant",
  lastName: "E2E",
  email: "etudiant.e2e@example.test",
  roles: [],
  companies: [],
};

const OFFERS = [
  {
    id: 101,
    title: "Développement web durable",
    companyShortName: "Entreprise E2E",
    academicYear: "2026-2027",
    period: "P1",
    status: "PUBLISHED",
  },
  {
    id: 102,
    title: "Analyse de données",
    companyShortName: "Entreprise E2E",
    academicYear: "2026-2027",
    period: "P1",
    status: "PUBLISHED",
  },
];

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gesta.token", "e2e-student-token");
  });
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: STUDENT }));
  await page.route("**/api/applications", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/offers**", (route) => route.fulfill({ json: OFFERS }));

  if (!baseURL) throw new Error("Playwright baseURL must be configured.");
  await page.goto(baseURL);
  await page.getByRole("link", { name: "Offres", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Offres de stage" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: OFFERS[0].title })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: OFFERS[1].title })).toBeVisible();
});

test("Scénario 1 - affiche uniquement les offres publiées correspondant à la recherche", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Rechercher par titre" });
  await expect(search).toBeVisible();
  await search.fill("Développement web");

  await expect(page.getByRole("row")).toHaveCount(2);
  await expect(page.getByText("1 offre", { exact: true })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: OFFERS[0].title })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: OFFERS[1].title })).toHaveCount(0);
  await expect(page.getByText("Publiée", { exact: true })).toBeVisible();
});

test("Scénario 2 - n’affiche aucune offre pour une recherche sans résultat", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Rechercher par titre" });
  await expect(search).toBeVisible();
  await search.fill("Titre inexistant E2E");

  await expect(page.getByRole("row")).toHaveCount(0);
  await expect(page.getByText("Aucune offre à afficher.", { exact: true })).toBeVisible();
});
