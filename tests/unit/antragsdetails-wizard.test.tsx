import { NextIntlClientProvider } from "next-intl";
import { axe } from "vitest-axe";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import deMessages from "../../messages/de.json";
import { AntragsdetailsWizard } from "@/components/kundenportal/AntragsdetailsWizard";
import { getPageSchema, getFormRuntime } from "@/lib/forms/runtime";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  }),
  usePathname: () => "/de/forms/hausanschluss-demo/antragsdetails"
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

function renderWizard(formId = "hausanschluss-demo", onNavigate = vi.fn()) {
  const runtime = getFormRuntime(formId);
  const page = getPageSchema(formId, "antragsdetails");

  if (!page) {
    throw new Error("page_not_found");
  }

  return {
    onNavigate,
    ...render(
      <NextIntlClientProvider locale="de" messages={deMessages}>
        <AntragsdetailsWizard formId={formId} locale="de" onNavigate={onNavigate} page={page} theme={runtime.theme} />
      </NextIntlClientProvider>
    )
  };
}

describe("AntragsdetailsWizard", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders schema-driven fields and reveals changeKind only for change_connection", async () => {
    renderWizard();
    const user = userEvent.setup();

    expect(screen.getByRole("heading", { name: "Antragsdetails" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Ausgewählte Medien/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Art des Antrags/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Art der Veränderung/)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Änderung"));

    expect(screen.getByLabelText(/Art der Veränderung/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Wunschtermin/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nachricht")).toBeInTheDocument();
  });

  it("shows page-level and field-level validation errors and blocks autosave", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWizard();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Weiter" }));

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(within(alert).getByText("Wähle mindestens ein Medium aus.")).toBeInTheDocument();
    expect(screen.getByText("Wähle mindestens ein Medium aus.", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Wähle eine Antragsart aus.", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Wähle einen Wunschtermin aus.", { selector: "p" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("opens a soft-required modal and allows skip after required fields are valid", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        applicationId: "app-123",
        nextPageKey: "anschlussort"
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const onNavigate = vi.fn();
    renderWizard("hausanschluss-soft-demo", onNavigate);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Strom"));
    await user.click(screen.getByLabelText("Änderung"));
    await user.selectOptions(screen.getByRole("combobox", { name: /Art der Veränderung/ }), "anlagen_erweiterung");
    await user.type(screen.getByLabelText(/Wunschtermin/), "2026-03-20");
    await user.click(screen.getByRole("button", { name: "Weiter" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Nachricht")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Überspringen" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/public/forms/hausanschluss-soft-demo/applications:draft",
        expect.objectContaining({
          method: "POST"
        })
      );
    });

    expect(onNavigate).toHaveBeenCalledWith("/de/forms/hausanschluss-soft-demo/anschlussort?applicationId=app-123");
  });

  it("has no obvious accessibility violations for the initial page state", async () => {
    const { container } = renderWizard();
    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false }
      }
    });

    expect(results.violations).toHaveLength(0);
  });
});
