import { type ApplicationEntity } from "../../../database/entities/application.entity";
import { type ApplicationPageDataEntity } from "../../../database/entities/application-page-data.entity";
import { type AttachmentEntity } from "../../../database/entities/attachment.entity";
import { type AppointmentEntity } from "../../../database/entities/appointment.entity";
import { type Condition, type ConditionGroup, type FieldBlock, type FormPage, type FormSchema } from "../form-schema.types";

type MissingSummaryItem = {
  pageKey: string;
  fieldPath: string;
  labelKey: string;
  issue: string;
  kind: "field" | "attachment";
};

type MissingSummary = {
  hard: MissingSummaryItem[];
  soft: MissingSummaryItem[];
  attachments: MissingSummaryItem[];
};

type BuildApplicationPdfBufferParams = {
  application: ApplicationEntity;
  attachments: AttachmentEntity[];
  appointment: AppointmentEntity | null;
  generatedAt?: Date;
  missingSummary: MissingSummary;
  pageData: ApplicationPageDataEntity[];
  schema: FormSchema;
  tenantName: string;
};

type KeyValueRow = {
  label: string;
  value: string;
};

type PdfPage = {
  commands: Buffer[];
};

type FontKey = "F1" | "F2";

type Color = [number, number, number];

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 48;
const HEADER_HEIGHT = 72;
const FOOTER_HEIGHT = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_END_Y = PAGE_HEIGHT - FOOTER_HEIGHT - 18;

const COLORS = {
  white: [1, 1, 1] as Color,
  ink: [0.11, 0.13, 0.17] as Color,
  muted: [0.34, 0.38, 0.45] as Color,
  border: [0.79, 0.82, 0.86] as Color,
  band: [0.08, 0.18, 0.36] as Color,
  accent: [0.74, 0.59, 0.2] as Color,
  panel: [0.96, 0.97, 0.98] as Color,
  warningBg: [0.99, 0.96, 0.9] as Color,
  warningBorder: [0.72, 0.57, 0.2] as Color
};

const LABELS: Record<string, string> = {
  "forms.hausanschluss.title": "Hausanschlussantrag",
  "pages.antragsdetails.title": "Antragsdetails",
  "pages.anschlussort.title": "Anschlussort",
  "pages.kontaktdaten.title": "Kontaktdaten",
  "pages.rechtlicheHinweise.title": "Rechtliche Hinweise",
  "pages.rechtliche-hinweise.title": "Rechtliche Hinweise",
  "sections.details.title": "Angaben zum Antrag",
  "sections.medium.title": "Gewünschte Medien",
  "sections.antragsart.title": "Art des Antrags",
  "sections.planung.title": "Planung",
  "sections.address.title": "Anschlussadresse",
  "sections.contact.title": "Antragstellende Person",
  "sections.contactData.title": "Kontaktdaten",
  "sections.consents.title": "Einwilligungen",
  "fields.selectedMedia.label": "Gewünschte Sparte",
  "fields.requestType.label": "Antragsart",
  "fields.changeKind.label": "Art der Änderung",
  "fields.wunschtermin.label": "Wunschtermin",
  "fields.message.label": "Nachricht",
  "fields.street.label": "Straße",
  "fields.houseNumber.label": "Hausnummer",
  "fields.postalCode.label": "Postleitzahl",
  "fields.city.label": "Ort",
  "fields.firstName.label": "Vorname",
  "fields.lastName.label": "Nachname",
  "fields.email.label": "E-Mail-Adresse",
  "fields.phone.label": "Telefonnummer",
  "fields.salutation.label": "Anrede",
  "fields.privacyPolicyAccepted.label": "Datenschutzhinweise bestätigt",
  "fields.dataProcessingAccepted.label": "Datenverarbeitung bestätigt",
  "fields.emailCommunicationAccepted.label": "E-Mail-Kommunikation bestätigt",
  "media.strom": "Strom",
  "media.gas": "Gas",
  "media.wasser": "Wasser",
  "requestType.new": "Neuanschluss",
  "requestType.change": "Änderung am Anschluss",
  "requestType.stilllegung": "Stilllegung",
  "changeKind.erweiterung": "Anlagenerweiterung",
  "changeKind.zusammenlegung": "Zusammenlegung",
  "status.DRAFT": "Entwurf",
  "status.SUBMITTED_INCOMPLETE": "Eingegangen mit offenen Punkten",
  "status.SUBMITTED_COMPLETE": "Vollständig eingegangen",
  "status.IN_REVIEW": "In Prüfung",
  "status.SCHEDULED": "Termin vereinbart",
  "status.APPROVED": "Freigegeben",
  "status.REJECTED": "Abgelehnt",
  "attachment.lageplan": "Lageplan",
  "attachment.default": "Anlage",
  "issue.required": "Pflichtangabe fehlt",
  "issue.soft_required": "Nachzureichen",
  "issue.invalid_date": "Ungültiges Datum",
  "issue.invalid_option": "Ungültige Auswahl",
  "issue.invalid_type": "Ungültiger Wert",
  "issue.max_length": "Text zu lang",
  "issue.min_items": "Zu wenige Angaben",
  "issue.max_items": "Zu viele Angaben"
};

export function buildApplicationPdfBuffer({
  application,
  attachments,
  appointment,
  generatedAt = new Date(),
  missingSummary,
  pageData,
  schema,
  tenantName
}: BuildApplicationPdfBufferParams): Buffer {
  const trackingCode = application.publicTrackingCode ?? application.id;
  const pageDataMap = buildPageDataMap(pageData);
  const applicantName = buildApplicantName(pageDataMap);
  const applicantAddress = buildApplicantAddress(pageDataMap);
  const contactPage = pageDataMap["kontaktdaten"] ?? {};
  const headerTitle = resolveLabel(schema.form.titleI18nKey, schema.form.key);
  const builder = new OfficialPdfBuilder({
    authorityName: tenantName || "Kommunaler Netzanschlussservice",
    documentTitle: headerTitle,
    reference: trackingCode,
    generatedAt
  });

  builder.addParagraph(
    "Dieses Dokument fasst die elektronisch übermittelten Angaben des Vorgangs zusammen. Maßgeblich bleiben die im Portal gespeicherten Daten sowie etwaige nachgereichte Nachweise."
  );

  builder.addSection("Vorgangsdaten");
  builder.addRows([
    { label: "Aktenzeichen", value: trackingCode },
    { label: "Verfahrensstatus", value: resolveLabel(`status.${application.status}`, application.status) },
    { label: "Antragseingang", value: formatDateTime(application.submittedAt ?? application.createdAt) },
    { label: "Letzte Aktualisierung", value: formatDateTime(application.lastActivityAt) },
    { label: "Formularversion", value: `Version ${schema.form.version ?? 1}` },
    { label: "Vollständigkeit", value: buildCompletenessLabel(missingSummary) },
    {
      label: "Vor-Ort-Termin",
      value: appointment ? `${formatDateTime(appointment.scheduledAt)}${appointment.notes ? ` | ${appointment.notes}` : ""}` : "Noch nicht terminiert"
    }
  ]);

  if (application.status === "SUBMITTED_INCOMPLETE" || buildOpenItemLines(schema, missingSummary).length > 0) {
    builder.addNoticeBox(
      "Bearbeitungshinweis",
      "Der Vorgang liegt noch nicht vollständig vor. Die aktuell bekannten Nachreichungen und offenen Punkte sind im Abschnitt \"Offene Punkte\" aufgeführt."
    );
  }

  builder.addSection("Antragstellende Person");
  builder.addRows(
    [
      { label: "Name", value: applicantName },
      { label: "Anschrift", value: applicantAddress },
      { label: "E-Mail-Adresse", value: toDisplayValue(contactPage.email) },
      { label: "Telefonnummer", value: toDisplayValue(contactPage.phone) }
    ].filter((row) => row.value !== "Nicht angegeben")
  );

  for (const page of [...schema.form.pages].sort((left, right) => left.order - right.order)) {
    const pageRows = buildPageRows(page, pageDataMap[page.key] ?? {});

    if (pageRows.length === 0) {
      continue;
    }

    builder.addSection(resolveLabel(page.titleI18nKey, page.key));

    for (const section of pageRows) {
      if (section.title) {
        builder.addSubsection(section.title);
      }

      builder.addRows(section.rows);
    }
  }

  builder.addSection("Anlagen");

  if (attachments.length > 0) {
    builder.addRows(
      attachments.map((attachment) => ({
        label: `${resolveLabel(`attachment.${attachment.categoryKey}`, attachment.categoryKey)} | Eingang ${formatDateTime(attachment.uploadedAt)}`,
        value: `${attachment.fileName} (${formatFileSize(attachment.sizeBytes)}, ${attachment.mimeType})`
      }))
    );
  } else {
    builder.addParagraph("Zum aktuellen Stand wurden keine Anlagen hochgeladen.");
  }

  builder.addSection("Offene Punkte");
  const openItems = buildOpenItemLines(schema, missingSummary);

  if (openItems.length > 0) {
    builder.addBulletList(openItems);
  } else {
    builder.addParagraph("Der Antrag liegt vollständig vor. Nach aktuellem Stand sind keine Nachreichungen erforderlich.");
  }

  builder.addSection("Vermerk");
  builder.addParagraph(
    "Dieses Schreiben wurde automatisiert im Kundenportal erzeugt und dient als übersichtliche Verfahrensakte für Kundschaft und Sachbearbeitung. Eine Unterschrift ist daher nicht erforderlich."
  );

  return builder.toBuffer();
}

function buildPageDataMap(pageData: ApplicationPageDataEntity[]) {
  return pageData.reduce<Record<string, Record<string, unknown>>>((result, item) => {
    result[item.pageKey] = item.dataJson ?? {};
    return result;
  }, {});
}

function buildPageRows(page: FormPage, data: Record<string, unknown>) {
  return page.sections
    .map((section) => {
      const rows = section.blocks.flatMap((block) => {
        if (block.type !== "field" || !isFieldVisible(block, data, page.key)) {
          return [];
        }

        const value = getFieldValue(block, data, page.key);
        const shouldShow = hasRenderableValue(value) || block.requirement !== "optional";

        if (!shouldShow) {
          return [];
        }

        return [
          {
            label: resolveLabel(block.labelI18nKey, block.id),
            value: formatFieldValue(block, value)
          }
        ];
      });

      return {
        title: page.sections.length > 1 ? resolveLabel(section.titleI18nKey, section.key) : "",
        rows
      };
    })
    .filter((section) => section.rows.length > 0);
}

function isFieldVisible(field: FieldBlock, data: Record<string, unknown>, pageKey: string) {
  if (!field.visibleWhen) {
    return true;
  }

  return evaluateGroup(field.visibleWhen, data, pageKey);
}

function evaluateGroup(group: ConditionGroup, data: Record<string, unknown>, pageKey: string) {
  if (group.all) {
    return group.all.every((condition) => evaluateCondition(condition, data, pageKey));
  }

  if (group.any) {
    return group.any.some((condition) => evaluateCondition(condition, data, pageKey));
  }

  return true;
}

function evaluateCondition(condition: Condition, data: Record<string, unknown>, pageKey: string) {
  const value = getValueByPath(condition.path, data, pageKey);

  if (condition.op === "equals") {
    return value === condition.value;
  }

  if (condition.op === "contains") {
    return Array.isArray(value) && value.includes(condition.value);
  }

  return false;
}

function getFieldValue(field: FieldBlock, data: Record<string, unknown>, pageKey: string) {
  if (field.id in data) {
    return data[field.id];
  }

  return getValueByPath(field.bind.path, data, pageKey);
}

function getValueByPath(path: string, data: Record<string, unknown>, pageKey: string) {
  const normalizedPath = path.startsWith(`${pageKey}.`) ? path.slice(pageKey.length + 1) : path;
  const parts = normalizedPath.split(".");
  let current: unknown = data;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function hasRenderableValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null;
}

function formatFieldValue(field: FieldBlock, value: unknown) {
  if (!hasRenderableValue(value)) {
    return "Nicht angegeben";
  }

  if (Array.isArray(value)) {
    const optionsById = new Map(field.options?.map((option) => [option.id, resolveLabel(option.labelI18nKey, option.id)]) ?? []);
    return value
      .map((item) => (typeof item === "string" ? optionsById.get(item) ?? prettifyToken(item) : toDisplayValue(item)))
      .join(", ");
  }

  if ((field.fieldType === "radio_group" || field.fieldType === "select") && typeof value === "string") {
    const option = field.options?.find((item) => item.id === value);
    return option ? resolveLabel(option.labelI18nKey, option.id) : prettifyToken(value);
  }

  if (field.fieldType === "date" && typeof value === "string") {
    return formatDateOnly(value);
  }

  return toDisplayValue(value);
}

function toDisplayValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : "Nicht angegeben";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Ja" : "Nein";
  }

  if (Array.isArray(value)) {
    return value.map((item) => toDisplayValue(item)).join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return "Nicht angegeben";
}

function buildApplicantName(pageDataMap: Record<string, Record<string, unknown>>) {
  const contact = pageDataMap["kontaktdaten"] ?? {};
  const parts = [contact.salutation, contact.firstName, contact.lastName]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "Nicht angegeben";
}

function buildApplicantAddress(pageDataMap: Record<string, Record<string, unknown>>) {
  const address = pageDataMap["anschlussort"] ?? {};
  const parts = [address.street, address.houseNumber, address.postalCode, address.city]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Nicht angegeben";
}

function buildCompletenessLabel(missingSummary: MissingSummary) {
  const openItems = buildOpenItemLines(null, missingSummary);
  return openItems.length > 0 ? `${openItems.length} offene Punkte` : "Vollständig";
}

function buildOpenItemLines(schema: FormSchema | null, missingSummary: MissingSummary) {
  const seen = new Set<string>();
  const combined = [...missingSummary.hard, ...missingSummary.soft, ...missingSummary.attachments];
  const pageTitleByKey = new Map(
    schema?.form.pages.map((page) => [page.key, resolveLabel(page.titleI18nKey, page.key)]) ?? []
  );

  return combined.flatMap((item) => {
    const dedupeKey = `${item.kind}:${item.fieldPath}:${item.issue}`;

    if (seen.has(dedupeKey)) {
      return [];
    }

    seen.add(dedupeKey);

    const pageTitle = pageTitleByKey.get(item.pageKey) ?? prettifyToken(item.pageKey);
    const fieldLabel = resolveLabel(item.labelKey, item.fieldPath.split(".").at(-1) ?? item.fieldPath);
    const issueLabel = resolveLabel(`issue.${item.issue}`, item.issue);

    if (item.kind === "attachment") {
      return [`${pageTitle}: ${fieldLabel} (${issueLabel})`];
    }

    return [`${pageTitle}: ${fieldLabel} (${issueLabel})`];
  });
}

function resolveLabel(labelKey: string | undefined, fallback: string) {
  if (labelKey && LABELS[labelKey]) {
    return LABELS[labelKey];
  }

  return prettifyToken(labelKey ?? fallback);
}

function prettifyToken(value: string) {
  const normalized = value
    .replace(/\.(label|title|help)$/g, "")
    .split(".")
    .filter(Boolean)
    .at(-1) ?? value;

  const withSpaces = normalized
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (withSpaces.length === 0) {
    return "Nicht angegeben";
  }

  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatDateOnly(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value instanceof Date ? date.toISOString() : value;
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin"
  }).format(date);
}

function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value instanceof Date ? date.toISOString() : value;
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin"
  }).format(date);
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} kB`;
  }

  return `${sizeBytes} B`;
}

class OfficialPdfBuilder {
  private readonly pages: PdfPage[] = [];
  private currentPage!: PdfPage;
  private currentY = 0;

  constructor(
    private readonly header: {
      authorityName: string;
      documentTitle: string;
      generatedAt: Date;
      reference: string;
    }
  ) {
    this.startPage();
  }

  addSection(title: string) {
    this.ensureSpace(34);
    this.drawRect(MARGIN_X, this.currentY, CONTENT_WIDTH, 22, COLORS.panel, COLORS.border);
    this.drawText(MARGIN_X + 12, this.currentY + 15, title, {
      color: COLORS.ink,
      font: "F2",
      size: 12
    });
    this.currentY += 30;
  }

  addSubsection(title: string) {
    this.ensureSpace(22);
    this.drawText(MARGIN_X, this.currentY + 10, title, {
      color: COLORS.ink,
      font: "F2",
      size: 10.5
    });
    this.drawLine(MARGIN_X, this.currentY + 16, PAGE_WIDTH - MARGIN_X, this.currentY + 16, COLORS.border, 0.8);
    this.currentY += 22;
  }

  addParagraph(text: string) {
    const lines = this.wrapText(text, CONTENT_WIDTH, 10.5);
    const lineHeight = 14;
    this.ensureSpace(lines.length * lineHeight + 8);

    for (const line of lines) {
      this.drawText(MARGIN_X, this.currentY + 10, line, {
        color: COLORS.ink,
        font: "F1",
        size: 10.5
      });
      this.currentY += lineHeight;
    }

    this.currentY += 4;
  }

  addNoticeBox(title: string, text: string) {
    const wrapped = this.wrapText(text, CONTENT_WIDTH - 24, 10);
    const height = 18 + wrapped.length * 13 + 14;
    this.ensureSpace(height + 8);

    this.drawRect(MARGIN_X, this.currentY, CONTENT_WIDTH, height, COLORS.warningBg, COLORS.warningBorder);
    this.drawText(MARGIN_X + 12, this.currentY + 14, title, {
      color: COLORS.ink,
      font: "F2",
      size: 11
    });

    let lineY = this.currentY + 30;

    for (const line of wrapped) {
      this.drawText(MARGIN_X + 12, lineY, line, {
        color: COLORS.ink,
        font: "F1",
        size: 10
      });
      lineY += 13;
    }

    this.currentY += height + 8;
  }

  addRows(rows: KeyValueRow[]) {
    if (rows.length === 0) {
      return;
    }

    const labelWidth = 166;
    const valueWidth = CONTENT_WIDTH - labelWidth - 22;
    const lineHeight = 13;

    for (const row of rows) {
      const labelLines = this.wrapText(row.label, labelWidth - 12, 9.5);
      const valueLines = this.wrapText(row.value, valueWidth, 10);
      const contentLines = Math.max(labelLines.length, valueLines.length, 1);
      const rowHeight = 10 + contentLines * lineHeight;

      this.ensureSpace(rowHeight + 2);
      this.drawLine(MARGIN_X, this.currentY, PAGE_WIDTH - MARGIN_X, this.currentY, COLORS.border, 0.6);

      labelLines.forEach((line, index) => {
        this.drawText(MARGIN_X, this.currentY + 12 + index * lineHeight, line, {
          color: COLORS.muted,
          font: "F2",
          size: 9.5
        });
      });

      valueLines.forEach((line, index) => {
        this.drawText(MARGIN_X + labelWidth, this.currentY + 12 + index * lineHeight, line, {
          color: COLORS.ink,
          font: "F1",
          size: 10
        });
      });

      this.currentY += rowHeight;
    }

    this.drawLine(MARGIN_X, this.currentY, PAGE_WIDTH - MARGIN_X, this.currentY, COLORS.border, 0.6);
    this.currentY += 10;
  }

  addBulletList(items: string[]) {
    const lineHeight = 13;

    for (const item of items) {
      const lines = this.wrapText(item, CONTENT_WIDTH - 18, 10);
      const blockHeight = Math.max(1, lines.length) * lineHeight + 2;
      this.ensureSpace(blockHeight + 2);
      this.drawText(MARGIN_X, this.currentY + 10, "-", {
        color: COLORS.ink,
        font: "F2",
        size: 11
      });

      lines.forEach((line, index) => {
        this.drawText(MARGIN_X + 14, this.currentY + 10 + index * lineHeight, line, {
          color: COLORS.ink,
          font: "F1",
          size: 10
        });
      });

      this.currentY += blockHeight;
    }

    this.currentY += 4;
  }

  toBuffer() {
    const pageBuffers = this.pages.map((page, index) => this.finalizePage(page, index));
    return buildPdfDocument(pageBuffers);
  }

  private startPage() {
    this.currentPage = {
      commands: []
    };
    this.pages.push(this.currentPage);

    this.drawRect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, COLORS.band, COLORS.band);
    this.drawText(MARGIN_X, 28, this.header.authorityName, {
      color: COLORS.white,
      font: "F2",
      size: 11
    });
    this.drawText(MARGIN_X, 52, this.header.documentTitle, {
      color: COLORS.white,
      font: "F2",
      size: 19
    });
    this.drawText(352, 28, "Amtliche Vorgangszusammenfassung", {
      color: COLORS.white,
      font: "F1",
      size: 9
    });
    this.drawText(352, 52, `Aktenzeichen ${this.header.reference}`, {
      color: COLORS.white,
      font: "F2",
      size: 10.5
    });
    this.drawLine(MARGIN_X, HEADER_HEIGHT + 3, PAGE_WIDTH - MARGIN_X, HEADER_HEIGHT + 3, COLORS.accent, 1.5);

    this.currentY = HEADER_HEIGHT + 28;
  }

  private finalizePage(page: PdfPage, index: number) {
    const pageNumber = `${index + 1} / ${this.pages.length}`;
    const footerLabel = `Elektronisch erstellt am ${formatDateTime(this.header.generatedAt)} | Seite ${pageNumber}`;
    const footerCommands = [
      this.createLineCommand(MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT, COLORS.border, 0.8),
      this.createTextCommand(MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT + 18, footerLabel, {
        color: COLORS.muted,
        font: "F1",
        size: 9
      })
    ];

    return Buffer.concat([...page.commands, ...footerCommands]);
  }

  private ensureSpace(height: number) {
    if (this.currentY + height <= CONTENT_END_Y) {
      return;
    }

    this.startPage();
  }

  private wrapText(text: string, maxWidth: number, fontSize: number) {
    const cleaned = sanitizeText(text);

    if (cleaned.length === 0) {
      return ["-"];
    }

    const words = cleaned.split(" ");
    const maxChars = Math.max(8, Math.floor(maxWidth / Math.max(fontSize * 0.55, 1)));
    const lines: string[] = [];
    let currentLine = "";

    for (const originalWord of words) {
      const segments = splitLongToken(originalWord, maxChars);

      for (const segment of segments) {
        const candidate = currentLine.length > 0 ? `${currentLine} ${segment}` : segment;

        if (candidate.length <= maxChars) {
          currentLine = candidate;
          continue;
        }

        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        currentLine = segment;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : ["-"];
  }

  private drawRect(x: number, top: number, width: number, height: number, fill: Color, stroke: Color) {
    this.currentPage.commands.push(this.createRectCommand(x, top, width, height, fill, stroke));
  }

  private drawLine(x1: number, top1: number, x2: number, top2: number, color: Color, width: number) {
    this.currentPage.commands.push(this.createLineCommand(x1, top1, x2, top2, color, width));
  }

  private drawText(
    x: number,
    top: number,
    text: string,
    options: {
      color: Color;
      font: FontKey;
      size: number;
    }
  ) {
    this.currentPage.commands.push(this.createTextCommand(x, top, text, options));
  }

  private createRectCommand(x: number, top: number, width: number, height: number, fill: Color, stroke: Color) {
    return Buffer.from(
      `q ${formatColor(fill, "fill")} ${formatColor(stroke, "stroke")} ${formatNumber(x)} ${formatNumber(toPdfBottom(top, height))} ${formatNumber(width)} ${formatNumber(height)} re B Q\n`,
      "ascii"
    );
  }

  private createLineCommand(x1: number, top1: number, x2: number, top2: number, color: Color, width: number) {
    return Buffer.from(
      `q ${formatColor(color, "stroke")} ${formatNumber(width)} w ${formatNumber(x1)} ${formatNumber(toPdfY(top1))} m ${formatNumber(x2)} ${formatNumber(toPdfY(top2))} l S Q\n`,
      "ascii"
    );
  }

  private createTextCommand(
    x: number,
    top: number,
    text: string,
    options: {
      color: Color;
      font: FontKey;
      size: number;
    }
  ) {
    const prefix = Buffer.from(
      `BT ${formatColor(options.color, "fill")} /${options.font} ${formatNumber(options.size)} Tf 1 0 0 1 ${formatNumber(x)} ${formatNumber(toPdfY(top))} Tm `,
      "ascii"
    );
    const suffix = Buffer.from(" Tj ET\n", "ascii");

    return Buffer.concat([prefix, pdfLiteral(text), suffix]);
  }
}

function buildPdfDocument(pageStreams: Buffer[]) {
  const objects: Buffer[] = [];
  const pageReferences: string[] = [];
  const regularFontObject = 3;
  const boldFontObject = 4;
  let nextObjectNumber = 5;

  for (const stream of pageStreams) {
    const pageObjectNumber = nextObjectNumber;
    const contentObjectNumber = nextObjectNumber + 1;
    pageReferences.push(`${pageObjectNumber} 0 R`);
    objects.push(
      buildObject(
        pageObjectNumber,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontObject} 0 R /F2 ${boldFontObject} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
      )
    );
    objects.push(buildStreamObject(contentObjectNumber, stream));
    nextObjectNumber += 2;
  }

  const allObjects = [
    buildObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    buildObject(2, `<< /Type /Pages /Kids [${pageReferences.join(" ")}] /Count ${pageStreams.length} >>`),
    buildObject(regularFontObject, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    buildObject(boldFontObject, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"),
    ...objects
  ];

  let pdf = Buffer.from("%PDF-1.4\n", "ascii");
  const offsets = [0];

  for (const object of allObjects) {
    offsets.push(pdf.length);
    pdf = Buffer.concat([pdf, object]);
  }

  const startXref = pdf.length;
  const xrefHeader = Buffer.from(`xref\n0 ${allObjects.length + 1}\n0000000000 65535 f \n`, "ascii");
  const xrefRows = offsets.slice(1).map((offset) => Buffer.from(`${String(offset).padStart(10, "0")} 00000 n \n`, "ascii"));
  const trailer = Buffer.from(`trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`, "ascii");

  return Buffer.concat([pdf, xrefHeader, ...xrefRows, trailer]);
}

function buildObject(objectNumber: number, body: string) {
  return Buffer.from(`${objectNumber} 0 obj\n${body}\nendobj\n`, "ascii");
}

function buildStreamObject(objectNumber: number, stream: Buffer) {
  const header = Buffer.from(`${objectNumber} 0 obj\n<< /Length ${stream.length} >>\nstream\n`, "ascii");
  const footer = Buffer.from("\nendstream\nendobj\n", "ascii");
  return Buffer.concat([header, stream, footer]);
}

function pdfLiteral(text: string) {
  const bytes = Buffer.from(sanitizeText(text), "latin1");
  const output: number[] = [40];

  for (const byte of bytes) {
    if (byte === 40 || byte === 41 || byte === 92) {
      output.push(92, byte);
      continue;
    }

    output.push(byte);
  }

  output.push(41);
  return Buffer.from(output);
}

function sanitizeText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, "\"")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLongToken(token: string, size: number) {
  if (token.length <= size) {
    return [token];
  }

  const parts: string[] = [];

  for (let index = 0; index < token.length; index += size) {
    parts.push(token.slice(index, index + size));
  }

  return parts;
}

function formatColor(color: Color, mode: "fill" | "stroke") {
  const operator = mode === "fill" ? "rg" : "RG";
  return `${formatNumber(color[0])} ${formatNumber(color[1])} ${formatNumber(color[2])} ${operator}`;
}

function toPdfY(top: number) {
  return PAGE_HEIGHT - top;
}

function toPdfBottom(top: number, height: number) {
  return PAGE_HEIGHT - top - height;
}

function formatNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}
