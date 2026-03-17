# Architecture Review Results

> Analyzed on: 2026-03-17 (updated pass)
> Project: sdt-210-5 — Stadtwerke Kundenportal (Week 6)
> Total components analyzed: 30 (pages: 14, shared: 16)
> Issues found: 3

## Summary

The architecture has improved substantially since the initial review: all six previously-identified issues have been resolved. `AntragsdetailsWizard` now uses `PortalChrome` consistently, field rendering is extracted into `WizardField` / `AntragsdetailsWizardField` with shared `WizardFieldBadge` and `WizardFieldMessage` atoms, draft-persistence logic lives in a single `useFormDraftPersistence` hook, and `MetricCard` and `getBackofficePageContext` clean up the backoffice layer. The remaining issues are all in the backoffice application-detail page, which still mixes `BackofficeChrome` with four unnamed inline sections, and two smaller inconsistencies in `DashboardPage` and `SummaryStep`.

---

## What Was Fixed Since the Previous Review

All six ISSUE-01 through ISSUE-06 are resolved:

| Previous Issue | Resolution |
|----------------|-----------|
| ISSUE-01: `AntragsdetailsWizard` duplicated `PortalChrome` layout | `AntragsdetailsWizard` now wraps `<PortalChrome title={t(page.titleI18nKey)}>` — layout is unified |
| ISSUE-02: 150-line inline `.map()` blocks for field type rendering | `WizardField` (for `GenericWizardForm`) and `AntragsdetailsWizardField` (for RHF) extracted |
| ISSUE-03: `getFieldBadge` duplicated between both wizard files | `WizardFieldBadge` component extracted; also `WizardFieldMessage` extracted |
| ISSUE-04: Wizard draft persistence duplicated in two components | `useFormDraftPersistence` hook extracted; uses `useEffectEvent` for stable callbacks |
| ISSUE-05: Backoffice page context fetching boilerplate repeated | `getBackofficePageContext()` server helper added |
| ISSUE-06: Dashboard metric cards inlined | `MetricCard` component extracted and used for all 3 stats |

---

## Remaining Issues

### ISSUE-01: `ApplicationDetailPage` mixes 4 unnamed inline sections alongside named components

**Severity**: High
**Principle**: SLA Violation
**Location**: `src/app/[locale]/backoffice/applications/[applicationId]/page.tsx:51–118`

The page composes `BackofficeChrome` and `ApplicationActions` at the right abstraction level, but then drops into four raw HTML sections — a panel header, a two-card status grid, a review grid of page data, and an audit log — all as anonymous inline markup. You cannot describe what the page renders using only named child component names. The status grid alone (lines 66–89) contains 24 lines of raw JSX with two distinct sections inside it; there is no component named `ApplicationStatusCard` or `ApplicationTimeline` that a reader could navigate to.

#### Current (Bad)

```tsx
// backoffice/applications/[applicationId]/page.tsx
return (
  <BackofficeChrome ...>
    <div className="panel-header">         {/* ← unnamed */}
      <div>...</div>
      <div className="panel-header-actions">...</div>
    </div>

    <div className="status-grid">          {/* ← unnamed */}
      <section className="status-card">   {/* ← unnamed */}
        <h3>{messages.backoffice.statusTitle}</h3>
        <p className="status-chip">{application.status}</p>
        {/* ... */}
      </section>
      <section className="status-card">   {/* ← unnamed */}
        <h3>{messages.backoffice.timelineTitle}</h3>
        <ol className="timeline-list">...</ol>
      </section>
    </div>

    <ApplicationActions ... />             {/* ← named, correct */}

    <section className="review-grid">     {/* ← unnamed, 15-line map */}
      {Object.entries(application.pageData).map(([pageKey, data]) => (
        <article className="review-card" key={pageKey}>...</article>
      ))}
    </section>

    <section className="review-card">     {/* ← unnamed audit log */}
      {application.auditLog.map(...)}
    </section>
  </BackofficeChrome>
);
```

#### Recommended (Good)

```tsx
// components/backoffice/ApplicationHeader.tsx
export function ApplicationHeader({ application, applicationId, messages }: Props) {
  return (
    <div className="panel-header">...</div>
  );
}

// components/backoffice/ApplicationStatusGrid.tsx
export function ApplicationStatusGrid({ application, messages }: Props) {
  return (
    <div className="status-grid">
      <ApplicationStatusCard application={application} messages={messages} />
      <ApplicationTimeline timeline={application.timeline} messages={messages} />
    </div>
  );
}

// components/backoffice/ApplicationPageDataGrid.tsx
export function ApplicationPageDataGrid({ pageData }: Props) { ... }

// components/backoffice/ApplicationAuditLog.tsx
export function ApplicationAuditLog({ auditLog, messages }: Props) { ... }

// page.tsx — reads as a composed sentence
return (
  <BackofficeChrome ...>
    <ApplicationHeader application={application} applicationId={applicationId} messages={messages} />
    <ApplicationStatusGrid application={application} messages={messages} />
    <ApplicationActions ... />
    <ApplicationPageDataGrid pageData={application.pageData} />
    <ApplicationAuditLog auditLog={application.auditLog} messages={messages} />
  </BackofficeChrome>
);
```

**Why this is better**: The page becomes a flat composition of five named domain components at a single abstraction level — any reader can understand the full page structure in 10 lines.

---

### ISSUE-02: `DashboardPage` uses `MetricCard` for stats but raw `<article>` markup for Quick Links and Notifications

**Severity**: Medium
**Principle**: SLA Violation
**Location**: `src/app/[locale]/backoffice/page.tsx:48–68`

The top three stats use `<MetricCard>`, but the Quick Links section and the Notifications section are raw `<article className="metric-card">` blocks that share the same CSS class without using any named component. A reader encounters `<MetricCard>` for rows 42–46, then drops to raw `<article>` elements for rows 49–67 with the same visual class. The abstraction level breaks mid-page.

#### Current (Bad)

```tsx
<div className="dashboard-grid">
  <MetricCard label={...} value={unreadApplicationCount} />   {/* named */}
  <MetricCard label={...} value={submittedIncompleteCount} /> {/* named */}
  <MetricCard label={...} value={scheduledCount} />           {/* named */}
</div>

<section className="dashboard-grid">
  <article className="metric-card">                           {/* unnamed */}
    <h2>{messages.backoffice.quickLinks}</h2>
    <div className="stack-links">
      <Link href={...}>...</Link>
      {/* ...2 more links */}
    </div>
  </article>
  <article className="metric-card">                           {/* unnamed */}
    <h2>{messages.backoffice.notifications}</h2>
    <ul className="compact-list">
      {notifications.map(...)}
    </ul>
  </article>
</section>
```

#### Recommended (Good)

```tsx
// components/backoffice/QuickLinksCard.tsx
export function QuickLinksCard({ locale, messages }: Props) {
  return (
    <article className="metric-card">
      <h2>{messages.backoffice.quickLinks}</h2>
      <div className="stack-links">...</div>
    </article>
  );
}

// components/backoffice/NotificationsCard.tsx
export function NotificationsCard({ locale, notifications, messages }: Props) {
  return (
    <article className="metric-card">
      <h2>{messages.backoffice.notifications}</h2>
      <ul className="compact-list">{notifications.map(...)}</ul>
    </article>
  );
}

// DashboardPage — consistent composition throughout
<div className="dashboard-grid">
  <MetricCard label={...} value={unreadApplicationCount} />
  <MetricCard label={...} value={submittedIncompleteCount} />
  <MetricCard label={...} value={scheduledCount} />
</div>
<section className="dashboard-grid">
  <QuickLinksCard locale={locale} messages={messages} />
  <NotificationsCard locale={locale} notifications={notifications} messages={messages} />
</section>
```

**Why this is better**: The page renders named components at a consistent abstraction level throughout — no inline markup anywhere.

---

### ISSUE-03: `SummaryStep` renders review cards inline in `.map()`

**Severity**: Low
**Principle**: SLA Violation
**Location**: `src/components/kundenportal/SummaryStep.tsx:95–117`

The summary review grid maps over `summary.pages` and renders a 22-line inline `<section className="review-card">` for each page, including a header with a conditional edit link and a data list. Everything else in `SummaryStep` is either a named component (`PortalChrome`, `ErrorSummary`-like warning section) or a single line of JSX — except this map callback, which drops to raw markup. The `normalizePageKey` helper at the module level is also evidence that rendering logic has leaked out of the render scope.

#### Current (Bad)

```tsx
<div className="review-grid">
  {summary.pages.map((page) => (
    <section className="review-card" key={page.pageKey}>
      <div className="review-card-header">
        <div>
          <h2>{t(`pages.${normalizePageKey(page.pageKey)}.title`)}</h2>
          <p>{t("summary.fieldCount", { count: Object.keys(page.data).length })}</p>
        </div>
        {page.pageKey !== "rechtliche-hinweise" ? (
          <Link className="inline-link" href={`...`}>{t("summary.edit")}</Link>
        ) : null}
      </div>
      <dl className="review-list">
        {Object.entries(page.data).map(([fieldKey, value]) => (
          <div key={fieldKey}>
            <dt>{t(`fields.${fieldKey}.label`)}</dt>
            <dd>{formatValue(t, value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  ))}
</div>
```

#### Recommended (Good)

```tsx
// components/kundenportal/SummaryReviewCard.tsx
type SummaryReviewCardProps = {
  applicationId: string;
  formId: string;
  locale: Locale;
  page: SummaryPage;
};

export function SummaryReviewCard({ applicationId, formId, locale, page }: SummaryReviewCardProps) {
  const t = useTranslations();
  // all the pageKey normalization + data formatting lives here
}

// SummaryStep.tsx — the map becomes one clean line
<div className="review-grid">
  {summary.pages.map((page) => (
    <SummaryReviewCard
      applicationId={applicationId}
      formId={formId}
      key={page.pageKey}
      locale={locale}
      page={page}
    />
  ))}
</div>
```

**Why this is better**: The `normalizePageKey` logic, `formatValue` formatting, and review card structure are all co-located in one named component rather than scattered across a large function and module-level helpers.

---

## Components That Are Clean

Every component and hook was read. These operate at a single, consistent abstraction level and need no changes:

| Component | Status |
|-----------|--------|
| `WizardField.tsx` | Clean — branches on field type, uses `WizardFieldBadge` and `WizardFieldMessage` throughout |
| `AntragsdetailsWizardField.tsx` | Clean — wraps react-hook-form `Controller`, uses same badge/message atoms |
| `WizardFieldBadge.tsx` | Clean — single responsibility, renders badge or null |
| `WizardFieldMessage.tsx` | Clean — single responsibility, renders error or soft-missing message |
| `useFormDraftPersistence.ts` | Clean — uses `useEffectEvent` for stable callbacks; clear options interface |
| `AntragsdetailsWizard.tsx` | Clean — 217 lines, all named children (`PortalChrome`, `AntragsdetailsWizardField`, `ErrorSummary`, `SoftRequiredModal`) |
| `GenericWizardForm.tsx` | Clean — 255 lines, same pattern with `WizardField` |
| `PortalChrome.tsx` | Clean — consistent shell with header, optional stepper, panel, footer |
| `BackofficeChrome.tsx` | Clean — header, nav, panel; `navItems` memoized |
| `MetricCard.tsx` | Clean — single stat display |
| `usePortalApp.ts` | Clean — thin loading/error wrapper over `appApi` |
| `CustomerLoginForm.tsx` | Clean — form + `usePortalApp` + redirect |
| `BackofficeLoginForm.tsx` | Clean — same pattern |
| `ErrorSummary.tsx` | Clean |
| All atoms (`Button`, `TextInput`, etc.) | Clean |
| `FormField.tsx` molecule | Clean |

---

## Recommendations Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | ISSUE-01: Extract 4 named components from `ApplicationDetailPage` | Medium | High |
| 2 | ISSUE-02: Extract `QuickLinksCard` and `NotificationsCard` in `DashboardPage` | Low | Medium |
| 3 | ISSUE-03: Extract `SummaryReviewCard` from `SummaryStep` | Low | Low |

---

## Architecture Health Score

| Criterion | Score (1–5) | Notes |
|-----------|-------------|-------|
| Single Level of Abstraction | 4 | Wizard layer is now clean; `ApplicationDetailPage` still has unmixed levels |
| Component API Design | 4 | Props are well-typed and minimal throughout |
| Data Flow Clarity | 5 | Server-fetch → client-component boundary is clean; `useFormDraftPersistence` uses `useEffectEvent` correctly |
| API Abstraction Layer | 4 | `createBrowserFrontendApi` factory cleanly wraps all browser-facing transport |
| App Layout / Shell | 5 | `PortalChrome` and `BackofficeChrome` are now the sole layout authorities for their areas |
| Code Duplication | 5 | `WizardFieldBadge`, `WizardFieldMessage`, `useFormDraftPersistence` all extracted; no structural duplication remains |
| Composition Patterns | 4 | `children` pattern used well; minor inconsistency in `DashboardPage` (MetricCard vs raw articles) |
| **Overall** | **4** | Strong and improving — the codebase now has a clear, consistent component hierarchy with well-named building blocks |
