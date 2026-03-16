"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useFrontendApi } from "@/lib/frontend/api-provider";

type ApplicationActionsProps = {
  applicationId: string;
  editableFields: Array<{
    fieldPath: string;
    label: string;
    value: string;
  }>;
  tenantId: string;
};

export function ApplicationActions({ applicationId, editableFields, tenantId }: ApplicationActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const { backoffice } = useFrontendApi();
  const [statusTarget, setStatusTarget] = useState("UNDER_REVIEW");
  const [statusNote, setStatusNote] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("2026-03-17T10:00");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [selectedFieldPath, setSelectedFieldPath] = useState(editableFields[0]?.fieldPath ?? "");
  const [newValue, setNewValue] = useState(editableFields[0]?.value ?? "");
  const [reason, setReason] = useState("Customer confirmed the update by phone.");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function runAction(action: () => Promise<void>) {
    try {
      setErrorKey(null);
      await action();
      router.refresh();
    } catch {
      setErrorKey("backoffice.actionError");
    }
  }

  return (
    <div className="action-grid">
      {errorKey ? <p className="field-message">{t(errorKey)}</p> : null}

      <section className="action-card">
        <h3>{t("backoffice.markReadTitle")}</h3>
        <button
          className="secondary-button"
          onClick={() => {
            void runAction(() => backoffice.markApplicationRead(tenantId, applicationId));
          }}
          type="button"
        >
          {t("backoffice.markRead")}
        </button>
      </section>

      <section className="action-card">
        <h3>{t("backoffice.transitionTitle")}</h3>
        <select className="field-control" onChange={(event) => setStatusTarget(event.target.value)} value={statusTarget}>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="WAITING_FOR_CUSTOMER">WAITING_FOR_CUSTOMER</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
        <textarea className="field-control-textarea" onChange={(event) => setStatusNote(event.target.value)} rows={3} value={statusNote} />
        <button
          className="wizard-button"
          onClick={() => {
            void runAction(() =>
              backoffice.transitionApplication(tenantId, applicationId, {
                toStatus: statusTarget,
                note: statusNote
              })
            );
          }}
          type="button"
        >
          {t("backoffice.transitionSubmit")}
        </button>
      </section>

      <section className="action-card">
        <h3>{t("backoffice.appointmentTitle")}</h3>
        <input className="field-control" onChange={(event) => setAppointmentAt(event.target.value)} type="datetime-local" value={appointmentAt} />
        <textarea className="field-control-textarea" onChange={(event) => setAppointmentNotes(event.target.value)} rows={3} value={appointmentNotes} />
        <button
          className="wizard-button"
          onClick={() => {
            void runAction(() =>
              backoffice.scheduleAppointment(tenantId, applicationId, {
                scheduledAt: appointmentAt,
                notes: appointmentNotes
              })
            );
          }}
          type="button"
        >
          {t("backoffice.appointmentSubmit")}
        </button>
      </section>

      <section className="action-card">
        <h3>{t("backoffice.quickEditTitle")}</h3>
        <select
          className="field-control"
          onChange={(event) => {
            const nextField = editableFields.find((item) => item.fieldPath === event.target.value);
            setSelectedFieldPath(event.target.value);
            setNewValue(nextField?.value ?? "");
          }}
          value={selectedFieldPath}
        >
          {editableFields.map((field) => (
            <option key={field.fieldPath} value={field.fieldPath}>
              {field.label}
            </option>
          ))}
        </select>
        <input className="field-control" onChange={(event) => setNewValue(event.target.value)} value={newValue} />
        <textarea className="field-control-textarea" onChange={(event) => setReason(event.target.value)} rows={3} value={reason} />
        <button
          className="wizard-button"
          onClick={() => {
            const pageKey = selectedFieldPath.split(".")[0];

            void runAction(() =>
              backoffice.saveApplicationEdits(tenantId, applicationId, pageKey, {
                edits: [
                  {
                    fieldPath: selectedFieldPath,
                    newValue,
                    reason
                  }
                ]
              })
            );
          }}
          type="button"
        >
          {t("backoffice.quickEditSubmit")}
        </button>
      </section>
    </div>
  );
}
