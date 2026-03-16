import { Inject, Injectable } from "@nestjs/common";

import { ApplicationEntity } from "../../../database/entities/application.entity";
import { ApplicationPageDataEntity } from "../../../database/entities/application-page-data.entity";
import { AppointmentEntity } from "../../../database/entities/appointment.entity";
import { type FormPage, type FormSchema, type ValidationIssue } from "../form-schema.types";
import { PageValidationService } from "./page-validation.service";

type MissingSummaryItem = {
  pageKey: string;
  fieldPath: string;
  labelKey: string;
  issue: string;
  kind: "field" | "attachment";
};

@Injectable()
export class ApplicationViewService {
  constructor(
    @Inject(PageValidationService)
    private readonly pageValidationService: PageValidationService
  ) {}

  buildPageDataMap(pageData: ApplicationPageDataEntity[]) {
    return pageData.reduce<Record<string, Record<string, unknown>>>((result, item) => {
      result[item.pageKey] = item.dataJson ?? {};
      return result;
    }, {});
  }

  buildSummary(schema: FormSchema, pageData: ApplicationPageDataEntity[]) {
    const pageDataMap = this.buildPageDataMap(pageData);
    const pages = [...schema.form.pages]
      .sort((left, right) => left.order - right.order)
      .map((page) => {
        const inspection = this.pageValidationService.inspectPage(page, pageDataMap[page.key] ?? {});

        return {
          pageKey: page.key,
          data: pageDataMap[page.key] ?? {},
          missing: {
            hard: inspection.hardIssues.map((issue) => this.toSummaryItem(page, issue)),
            soft: inspection.softIssues.map((issue) => this.toSummaryItem(page, issue)),
            attachments: inspection.softIssues
              .filter((issue) => issue.kind === "attachment")
              .map((issue) => this.toSummaryItem(page, issue))
          }
        };
      });

    const hard = pages.flatMap((page) => page.missing.hard);
    const soft = pages.flatMap((page) => page.missing.soft.filter((item) => item.kind !== "attachment"));
    const attachments = pages.flatMap((page) => page.missing.attachments);

    return {
      pages,
      missingSummary: {
        hard,
        soft,
        attachments
      }
    };
  }

  buildCustomerSummary(pageData: ApplicationPageDataEntity[]) {
    const pageDataMap = this.buildPageDataMap(pageData);
    const contact = pageDataMap["kontaktdaten"] ?? {};
    const address = pageDataMap["anschlussort"] ?? {};
    const name = [contact.firstName, contact.lastName].filter((value) => typeof value === "string" && value.length > 0).join(" ");
    const resolvedAddress = [address.street, address.houseNumber, address.postalCode, address.city]
      .filter((value) => typeof value === "string" && value.length > 0)
      .join(", ");

    return {
      name: name || "New application",
      address: resolvedAddress || "Address not captured yet"
    };
  }

  buildTimeline(application: ApplicationEntity, appointment: AppointmentEntity | null = null) {
    const storedTimeline = Array.isArray(application.timelineJson) ? application.timelineJson : [];

    if (storedTimeline.length > 0) {
      return storedTimeline;
    }

    const timeline = [
      {
        status: "DRAFT",
        at: application.createdAt.toISOString(),
        note: "Draft created"
      }
    ];

    if (application.submittedAt) {
      timeline.push({
        status: application.status.startsWith("SUBMITTED") ? application.status : "SUBMITTED_COMPLETE",
        at: application.submittedAt.toISOString(),
        note: "Application submitted"
      });
    }

    if (appointment) {
      timeline.push({
        status: "SCHEDULED",
        at: appointment.scheduledAt.toISOString(),
        note: appointment.notes || appointment.scheduledAt.toISOString()
      });
    }

    return timeline;
  }

  appendTimeline(application: ApplicationEntity, status: string, note?: string) {
    const timeline = this.buildTimeline(application);

    return [
      ...timeline,
      {
        status,
        at: new Date().toISOString(),
        note
      }
    ];
  }

  private toSummaryItem(page: FormPage, issue: ValidationIssue): MissingSummaryItem {
    return {
      pageKey: page.key,
      fieldPath: issue.path,
      labelKey: issue.labelKey ?? issue.path,
      issue: issue.issue,
      kind: issue.kind ?? "field"
    };
  }
}
