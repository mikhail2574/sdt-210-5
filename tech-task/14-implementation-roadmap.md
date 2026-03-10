# Implementation roadmap (2–4 week iterations)

## Executive summary

Цель — не «идеальная архитектура», а быстрый, качественный demo-ready MVP, который без переделок масштабируется до production.

## Deliverables
- milestones
- sprint plan
- dependency graph
- demo-ready критерии

## Milestones (high level)

M0: Foundation
- monorepo + CI
- db migrations
- auth base
- tenant config + demo tenant

M1: Kundenportal core
- form schema runtime render (MVP subset)
- draft creation + autosave pages
- required/soft_required UI

M2: Submit + emails + credentials + login
- consent step
- submit flow
- email outbox + SES integration
- customer login + resume

M3: Backoffice core
- staff login + RBAC
- list/detail
- edit mode + audit
- notifications bell

M4: PDF + export
- pdf worker + templates
- download in portal + backoffice
- CSV export

M5: A11y hardening + i18n + polish
- axe suite clean
- translations de/en/tr/es
- responsive/zoom QA

M6: OCR demo
- upload + OCR job + verify UI

## Sprint plan (пример: 3 спринта по 3 недели)

### Sprint 1 (Weeks 1–3): Foundation + Kundenportal skeleton
Deliverables:
- Docker compose (postgres)
- DB schema v1
- Public form fetch + tenant theme apply
- Wizard routing + stepper
- Page 1 (antragsdetails) + draft create endpoint
- Basic i18n scaffolding

Acceptance:
- draft создается
- required validation работает
- theme применяется

### Sprint 2 (Weeks 4–6): Full wizard + submit + customer login
Deliverables:
- остальные страницы wizard (anschlussort/kontaktdaten/technische daten/consent/summary/final)
- soft_required semantics
- submit + credential email outbox
- customer login/resume
- cleanup jobs (draft 2 days)

Acceptance:
- flow A проходит E2E
- emails отправляются (sandbox ok)
- incomplete -> complete работает

### Sprint 3 (Weeks 7–9): Backoffice + audit + PDF + exports + A11y
Deliverables:
- backoffice list/detail/edit/audit
- status transitions + appointment
- pdf worker + download
- CSV export
- a11y + visual regression
- retention incomplete 1 month

Acceptance:
- flow B/C/D/E проходят
- demo ready package

## Timeline (Mermaid)

~~~mermaid
timeline
  title MVP Roadmap (пример)
  Week 1-3 : Foundation + Kundenportal skeleton
  Week 4-6 : Full wizard + Submit + Customer login
  Week 7-9 : Backoffice + Audit + PDF + A11y
  Week 10 : OCR demo + polish + demo rehearsal
~~~
