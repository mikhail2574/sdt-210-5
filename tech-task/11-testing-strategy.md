# Testing strategy (unit/component/api/e2e/a11y/visual)

## Executive summary

Quality bar: «всё покрыто тестами и работает end-to-end». Обязательные слои:
- Unit (utils, validation, mappers)
- Component (React Testing Library)
- API integration (supertest)
- E2E (Playwright)
- A11y automation (axe-core)
- Visual regression (Percy/Playwright snapshots)
CI обязан прогонять всё.

## Deliverables
- tooling и конфигурация
- test matrix по страницам/ролям
- список критических E2E flows
- примеры тестов (Jest/Playwright)
- CI gating rules

## Tooling (рекомендация)
- Unit: Vitest (быстрее) или Jest (если команда предпочитает)
- Component: React Testing Library
- API: supertest
- E2E: Playwright
- A11y: @axe-core/playwright
- Visual: Percy (или Playwright snapshot diff на SVG/PNG)

## Test environments
- Local: docker compose (postgres + app)
- CI: ephemeral postgres service контейнер
- Seed:
  - demo tenant P001
  - base forms + overrides fixtures
  - demo users: platform admin, tenant admin, staff, installateur

## Critical E2E flows (must-pass)

### Flow A: Draft → Submit incomplete → Resume → Complete
1) open public form link (formId)
2) step 1 заполнить required
3) next → draft created
4) на одном шаге оставить soft_required пустым → next (accept warning)
5) пройти consent
6) submit → получаем tracking code (из response mock) и email outbox created
7) login with tracking+password
8) дозаполнить missing soft_required
9) resubmit/confirm → status becomes SUBMITTED_COMPLETE

### Flow B: Backoffice processing
1) staff login
2) list filter SUBMITTED_COMPLETE
3) open application detail (read mode)
4) edit mode → change field → saves → audit record created
5) transition UNDER_REVIEW
6) schedule appointment → email outbox created
7) transition SCHEDULED → IN_PROGRESS → COMPLETED

### Flow C: Tenant isolation
1) staff tenant A login
2) attempt open applicationId from tenant B → 403/404
3) verify no leakage in list queries

### Flow D: PDF
1) after submit: request PDF
2) verify URL returned and download > 0 bytes

### Flow E: A11y smoke
- run axe on each wizard page + backoffice list/detail

## Sample unit test (validation rules)

~~~ts
import { describe, it, expect } from "vitest";
import { buildZodSchemaFromForm } from "@/form-engine/zodBuilder";

describe("form engine - zod builder", () => {
  it("enforces required field", () => {
    const schema = buildZodSchemaFromForm({
      fields: [{ id: "email", fieldType: "text", requirement: "required", validation: { email: true }, bind: { path: "x.email" } }]
    });
    const result = schema.safeParse({ x: { email: "" } });
    expect(result.success).toBe(false);
  });
});
~~~

## Sample Playwright + axe

~~~ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a11y: antragsdetails has no serious violations", async ({ page }) => {
  await page.goto("/public/forms/demo-form");
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(v => ["serious","critical"].includes(v.impact ?? ""));
  expect(serious).toEqual([]);
});
~~~

## API integration test (tenant isolation)

~~~ts
import request from "supertest";

it("denies cross-tenant application access", async () => {
  const tokenA = await loginAsStaffTenantA();
  const res = await request(app)
    .get(`/api/tenants/${tenantA}/applications/${applicationFromTenantB}`)
    .set("Authorization", `Bearer ${tokenA}`);
  expect([403,404]).toContain(res.statusCode);
});
~~~

## CI gating rules
- Любой PR:
  - lint/typecheck must pass
  - unit/component/api tests must pass
  - E2E must pass
  - a11y must pass (0 critical/serious)
- Main branch:
  - build + deploy only if all gates green
