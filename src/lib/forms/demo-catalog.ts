export const demoRouteFormIds = {
  demo: "hausanschluss-demo",
  softDemo: "hausanschluss-soft-demo"
} as const;

export const demoPublicFormIds = {
  [demoRouteFormIds.demo]: "10000000-0000-4000-8000-000000000101",
  [demoRouteFormIds.softDemo]: "10000000-0000-4000-8000-000000000102"
} as const;

export function resolveBackendFormId(formId: string) {
  return demoPublicFormIds[formId as keyof typeof demoPublicFormIds] ?? formId;
}

export function resolveRouteFormId(formId: string) {
  if (formId in demoPublicFormIds) {
    return formId;
  }

  const reverseEntry = Object.entries(demoPublicFormIds).find(([, publicFormId]) => publicFormId === formId);
  return reverseEntry?.[0] ?? demoRouteFormIds.demo;
}

export const resolveLocalRuntimeFormId = resolveRouteFormId;
