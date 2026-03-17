# Architecture Review Results

> Analyzed on: 2026-03-17
> Project: sdt-210-5 — Stadtwerke Kundenportal (Week 6)
> Total components analyzed: 26 (pages: 14, shared: 12)
> Issues found: 6

## Summary

The project's high-level architecture is solid: a clean layering of `api-client` → `usePortalApp` hook → thin page/component rendering is consistently followed, and the backend-as-source-of-truth principle from CLAUDE.md is well-respected. The most impactful problems are concentrated in the two wizard form components (`AntragsdetailsWizard` and `GenericWizardForm`), which are the largest files in the repo and share significant structural duplication — including an identical `getFieldBadge` helper, near-identical persistence/hydration state machines, and deeply nested inline JSX for each field type that should be named components. A secondary issue is that `AntragsdetailsWizard` renders its own layout shell from scratch instead of delegating to `PortalChrome`, creating an inconsistency in how wizard pages look and behave.

---

## Issues

### ISSUE-01: `AntragsdetailsWizard` duplicates the `PortalChrome` shell layout

**Severity**: High
**Principle**: SLA Violation / Code Duplication
**Location**: `src/components/kundenportal/AntragsdetailsWizard.tsx:195–417`

`AntragsdetailsWizard` owns its entire outer shell (the `<main className="wizard-shell">`, header, brand, stepper) inline in its return statement, while every other wizard page delegates that shell to `PortalChrome`. This means two copies of the layout structure must be kept in sync, and it's impossible to look at `AntragsdetailsWizard.tsx` and know that it produces the same shell as the other pages. The reason it avoids `PortalChrome` is that `PortalChrome` hardcodes the title string (`"forms.hausanschluss.title"`) — the fix is to make `PortalChrome` accept the title as a prop.

#### Current (Bad)

```tsx
// AntragsdetailsWizard.tsx — manually builds the same shell PortalChrome already provides
return (
  <main className="wizard-shell" style={getThemeVariables(theme)}>
    <div className="wizard-container">
      <header className="wizard-header">
        <div className="wizard-brand">
          <img alt={t(theme.logo.altI18nKey)} src={theme.logo.url} />
          <div>
            <p>{t("wizard.headerTitle")}</p>
            <strong>{t(page.titleI18nKey)}</strong>  {/* only difference */}
          </div>
        </div>
        <LanguageSwitcher locale={locale} />
      </header>
      {/* ... rest of duplicated layout */}
    </div>
  </main>
);
```

#### Recommended (Good)

```tsx
// PortalChrome.tsx — accept an optional title prop
type PortalChromeProps = {
  children: ReactNode;
  currentPageKey?: PublicWizardPageKey;
  locale: Locale;
  theme: ThemeConfig;
  title?: string;  // ← new
};

export function PortalChrome({ children, currentPageKey, locale, theme, title }: PortalChromeProps) {
  return (
    <main className="wizard-shell" style={getThemeVariables(theme)}>
      {/* ...header with title ?? t("forms.hausanschluss.title") ... */}
    </main>
  );
}

// AntragsdetailsWizard.tsx — remove shell markup, delegate to PortalChrome
return (
  <PortalChrome currentPageKey={page.key as PublicWizardPageKey} locale={locale} theme={theme} title={t(page.titleI18nKey)}>
    <h1 className="wizard-page-title">{t(page.titleI18nKey)}</h1>
    <ErrorSummary errors={errorEntries} />
    {/* ... sections ... */}
  </PortalChrome>
);
```

**Why this is better**: All wizard pages consistently delegate their shell to `PortalChrome`, so layout changes (footer links, header style, stepper) only need to be made in one place.

---

### ISSUE-02: Field rendering is inlined as 40–60 line `.map()` blocks instead of a `<WizardField>` component

**Severity**: High
**Principle**: SLA Violation
**Location**: `src/components/kundenportal/AntragsdetailsWizard.tsx:224–387`, `src/components/kundenportal/GenericWizardForm.tsx:248–427`

Both wizard forms contain a `section.blocks.map()` / `section.fields.map()` callback that is 150+ lines long, branching on field type (`checkbox_group`, `radio_group`, `file_list`, `select`, `textarea`, `text`). Each branch is a 20–50 line block of inline JSX with its own logic for `checked` state, `onChange` handlers, and error/soft-missing message rendering. You cannot describe what the wizard renders in a single sentence using only child component names because the rendering logic for each field is anonymous, buried inside a map callback.

#### Current (Bad)

```tsx
// GenericWizardForm.tsx — one of several 40-line inline branches inside map()
{section.fields.map((field) => {
  // ...
  if (field.type === "radio_group" || field.type === "checkbox_group") {
    return (
      <div className={shellClassName} id={`field-${field.id}`} key={field.id}>
        <fieldset aria-describedby={...} className="choice-group">
          <legend>
            {t(field.labelKey)}
            {getFieldBadge(field.requirement, t)}
          </legend>
          {field.options?.map((option) => (
            <label className="choice-option" key={option.value}>
              <input
                checked={field.type === "radio_group" ? values[field.id] === option.value : ...}
                onChange={(event) => { /* 6 lines of logic */ }}
                type={field.type === "radio_group" ? "radio" : "checkbox"}
                value={option.value}
              />
              <span>{t(option.labelKey)}</span>
            </label>
          ))}
        </fieldset>
        {renderFieldMessage(...)}
      </div>
    );
  }
  // ...plus 3 more branches of equal size
})}
```

#### Recommended (Good)

```tsx
// components/kundenportal/WizardField.tsx — named component at a consistent level
type WizardFieldProps = {
  config: WizardFieldConfig;
  value: unknown;
  error?: ErrorMap[string];
  hasSoftMissing: boolean;
  onChange: (field: WizardFieldConfig, value: unknown) => void;
};

export function WizardField({ config, value, error, hasSoftMissing, onChange }: WizardFieldProps) {
  // all the branching logic lives here, in one named place
}

// GenericWizardForm.tsx — the map() callback becomes one line
{section.fields.map((field) =>
  isWizardFieldVisible(field, values) ? (
    <WizardField
      key={field.id}
      config={field}
      value={values[field.id]}
      error={errors[field.id]}
      hasSoftMissing={softMissingIds.includes(field.id)}
      onChange={handleChange}
    />
  ) : null
)}
```

**Why this is better**: The section's `.map()` now reads as a sentence — "for each visible field, render a WizardField" — and field-type rendering logic has a single home where it can be found and modified.

---

### ISSUE-03: `getFieldBadge` is copy-pasted verbatim between both wizard components

**Severity**: High
**Principle**: Code Duplication
**Location**: `src/components/kundenportal/AntragsdetailsWizard.tsx:29–47`, `src/components/kundenportal/GenericWizardForm.tsx:43–61`

The `getFieldBadge` function — which renders a `required` or `soft_required` badge span — is 18 lines of identical JSX in both files. It also uses slightly different types (`FieldBlock["requirement"]` vs `WizardFieldConfig["requirement"]`) which will drift if the badge logic ever changes in one file but not the other.

#### Current (Bad)

```tsx
// AntragsdetailsWizard.tsx
function getFieldBadge(requirement: FieldBlock["requirement"], t: ...) { ... }

// GenericWizardForm.tsx — same function, different type annotation
function getFieldBadge(requirement: WizardFieldConfig["requirement"], t: ...) { ... }
```

#### Recommended (Good)

```tsx
// components/kundenportal/WizardFieldBadge.tsx — or inline within the WizardField component from ISSUE-02
type Requirement = "required" | "soft_required" | "optional";

export function WizardFieldBadge({ requirement }: { requirement: Requirement }) {
  if (requirement === "required") return <span className="field-badge required">...</span>;
  if (requirement === "soft_required") return <span className="field-badge soft_required">...</span>;
  return null;
}
```

**Why this is better**: One definition, one change point; the type union is derived from the actual values, not tied to whichever interface a specific wizard happens to use.

---

### ISSUE-04: Wizard form persistence/hydration logic is duplicated in two components

**Severity**: Medium
**Principle**: Code Duplication
**Location**: `src/components/kundenportal/AntragsdetailsWizard.tsx:109–153`, `src/components/kundenportal/GenericWizardForm.tsx:97–128`

Both wizard components contain two nearly identical `useEffect` blocks: one that restores a persisted draft from the Zustand store on hydration, and one that saves the draft on every deferred value change. The logic is the same (check `hasHydrated`, check session, check `didRestorePersistedState`, merge with `initialValues`). When ISSUE-02's `WizardField` extraction is done, the natural next step is to lift this shared persistence logic into a custom hook.

#### Current (Bad)

```tsx
// AntragsdetailsWizard.tsx AND GenericWizardForm.tsx — same pattern twice
useEffect(() => {
  if (!hasHydrated || didRestorePersistedState) return;
  const persistedSession = useAppStore.getState().formSessions[formId];
  // restore draft logic...
  setDidRestorePersistedState(true);
}, [didRestorePersistedState, formId, hasHydrated, ...]);

useEffect(() => {
  if (!hasHydrated) return;
  saveFormPageDraft(formId, pageKey, deferredValues);
}, [deferredValues, formId, hasHydrated, pageKey, saveFormPageDraft]);
```

#### Recommended (Good)

```tsx
// hooks/useFormDraftPersistence.ts — extracted shared logic
export function useFormDraftPersistence(formId: string, pageKey: string, deferredValues: unknown) {
  // both effects, both state vars, returns { applicationId, setApplicationId }
}

// In each wizard — two effects become one hook call
const { applicationId, setApplicationId } = useFormDraftPersistence(formId, pageKey, deferredValues);
```

**Why this is better**: The draft persistence logic is a cross-cutting concern; it doesn't belong to either wizard form specifically, and extracting it makes each wizard shorter and easier to reason about.

---

### ISSUE-05: Backoffice pages repeat the same data-fetching boilerplate on every page

**Severity**: Medium
**Principle**: Code Duplication
**Location**: `src/app/[locale]/backoffice/page.tsx:24–31`, `src/app/[locale]/backoffice/applications/page.tsx:29–37`, `src/app/[locale]/backoffice/applications/[applicationId]/page.tsx:26–32`

Every backoffice page independently fetches `requireServerStaffUser`, extracts `tenantIds`, then fetches `getBackofficeNotificationsForTenants`. All three pages destructure `.items` and pass `notificationsPayload.unreadCount` and `notifications` as separate props to `BackofficeChrome`. This is four lines of identical code in every backoffice page. Adding a new backoffice page means repeating this pattern again.

#### Current (Bad)

```tsx
// Repeated in every backoffice page.tsx
const user = await requireServerStaffUser(locale as Locale);
const tenantIds = user.tenants.map((tenant) => tenant.tenantId);
const [notificationsPayload, ...] = await Promise.all([
  getBackofficeNotificationsForTenants(tenantIds),
  // ...page-specific data
]);
```

#### Recommended (Good)

```tsx
// lib/backend/server-data.ts — add a convenience helper
export async function getBackofficePageContext(locale: Locale) {
  const user = await requireServerStaffUser(locale);
  const tenantIds = user.tenants.map((t) => t.tenantId);
  const notificationsPayload = await getBackofficeNotificationsForTenants(tenantIds);
  return { user, tenantIds, notifications: notificationsPayload.items, unreadCount: notificationsPayload.unreadCount };
}

// In each page — one call replaces four lines
const { user, tenantIds, notifications, unreadCount } = await getBackofficePageContext(locale as Locale);
```

**Why this is better**: New backoffice pages have one line of context setup instead of four, and notifications/auth fetching logic has a single definition.

---

### ISSUE-06: `DashboardPage` inlines metric card markup for three identical cards

**Severity**: Low
**Principle**: SLA Violation
**Location**: `src/app/[locale]/backoffice/page.tsx:44–57`

`DashboardPage` renders three `<article className="metric-card">` elements with identical structure (h2 label + strong value) using raw markup three times rather than a named component. The page operates at two abstraction levels simultaneously: `BackofficeChrome` at the top, raw HTML elements for the metrics grid below. It's a minor issue now (three cards), but adding a fourth metric or changing card structure means editing three places.

#### Current (Bad)

```tsx
<div className="dashboard-grid">
  <article className="metric-card">
    <h2>{messages.backoffice.metrics.unread}</h2>
    <strong>{unreadCount}</strong>
  </article>
  <article className="metric-card">
    <h2>{messages.backoffice.metrics.incomplete}</h2>
    <strong>{submittedIncompleteCount}</strong>
  </article>
  {/* ...third card identical in structure */}
</div>
```

#### Recommended (Good)

```tsx
// components/backoffice/MetricCard.tsx
export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric-card">
      <h2>{label}</h2>
      <strong>{value}</strong>
    </article>
  );
}

// DashboardPage — reads as a clear composition
<div className="dashboard-grid">
  <MetricCard label={messages.backoffice.metrics.unread} value={unreadCount} />
  <MetricCard label={messages.backoffice.metrics.incomplete} value={submittedIncompleteCount} />
  <MetricCard label={messages.backoffice.metrics.scheduled} value={scheduledCount} />
</div>
```

**Why this is better**: The page composes named components at a single abstraction level, and the card structure is defined once.

---

## Recommendations Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | ISSUE-02: Extract `WizardField` component from inline map() blocks | High | High |
| 2 | ISSUE-01: Make `AntragsdetailsWizard` use `PortalChrome` (requires ISSUE-02 first) | Low | High |
| 3 | ISSUE-03: Extract shared `WizardFieldBadge` component | Low | Medium |
| 4 | ISSUE-04: Extract `useFormDraftPersistence` hook | Medium | Medium |
| 5 | ISSUE-05: Add `getBackofficePageContext` server helper | Low | Medium |
| 6 | ISSUE-06: Extract `MetricCard` component in dashboard | Low | Low |

---

## Architecture Health Score

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Single Level of Abstraction | 2 | Wizard forms have 150+ line map() callbacks with inline field rendering; `AntragsdetailsWizard` duplicates the `PortalChrome` shell |
| Component API Design | 4 | Props are well-typed and minimal; `BackofficeChrome` receiving `notifications[]` and `unreadCount` separately is a minor coupling smell |
| Data Flow Clarity | 5 | Server components fetch, pass to client components; mutations all go through `usePortalApp`; no prop drilling; clean |
| API Abstraction Layer | 4 | `createBrowserFrontendApi` is a well-designed factory with injected `fetch`; `FrontendApiError` is typed and typed; factory-function rather than class, but the injection mechanism (`fetchImpl`) is equally explicit and testable |
| App Layout / Shell | 3 | `PortalChrome` and `BackofficeChrome` exist and are used consistently — except `AntragsdetailsWizard` bypasses `PortalChrome` entirely |
| Code Duplication | 2 | `getFieldBadge` copy-pasted verbatim; wizard persistence logic near-identical; backoffice page boilerplate repeated in every page |
| Composition Patterns | 3 | Good use of atoms/molecules for form controls; `children` pattern used correctly in Chrome components; field rendering in wizards breaks the pattern |
| **Overall** | **3** | Strong foundation and correct high-level architecture; technical debt is concentrated in the two wizard components which need a `WizardField` extraction before the codebase can grow cleanly |
