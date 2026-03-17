import { randomUUID } from "node:crypto";

import { InjectRepository } from "@nestjs/typeorm";
import { Inject, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

import { ApplicationAuditLogEntity } from "../../../database/entities/application-audit-log.entity";
import { ApplicationEntity } from "../../../database/entities/application.entity";
import { ApplicationPageDataEntity } from "../../../database/entities/application-page-data.entity";
import { AttachmentEntity } from "../../../database/entities/attachment.entity";
import { AppointmentEntity } from "../../../database/entities/appointment.entity";
import { FormDefinitionEntity } from "../../../database/entities/form-definition.entity";
import { FormOverrideEntity } from "../../../database/entities/form-override.entity";
import { InvitationEntity } from "../../../database/entities/invitation.entity";
import { TenantEntity } from "../../../database/entities/tenant.entity";
import { ApiConflictException, ApiResourceNotFoundException, ApiTenantIsolationException, ApiValidationException } from "../errors/api-http.exceptions";
import { type CreateInvitationDto } from "../dto/create-invitation.dto";
import { type ScheduleAppointmentDto } from "../dto/schedule-appointment.dto";
import { type TransitionApplicationDto } from "../dto/transition-application.dto";
import { type UpdateFormOverrideDto } from "../dto/update-form-override.dto";
import { type UpdateStaffPageDto } from "../dto/update-staff-page.dto";
import { type FormOverrideOperation, type ThemeConfig } from "../form-schema.types";
import { ApplicationViewService } from "./application-view.service";
import { AuthService } from "./auth.service";
import { EmailService } from "./email.service";
import { EffectiveFormService } from "./effective-form.service";
import { PageValidationService } from "./page-validation.service";

@Injectable()
export class BackofficeService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationPageDataEntity)
    private readonly applicationPageDataRepository: Repository<ApplicationPageDataEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    @InjectRepository(ApplicationAuditLogEntity)
    private readonly applicationAuditLogRepository: Repository<ApplicationAuditLogEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(FormDefinitionEntity)
    private readonly formDefinitionRepository: Repository<FormDefinitionEntity>,
    @InjectRepository(FormOverrideEntity)
    private readonly formOverrideRepository: Repository<FormOverrideEntity>,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(EffectiveFormService)
    private readonly effectiveFormService: EffectiveFormService,
    @Inject(PageValidationService)
    private readonly pageValidationService: PageValidationService,
    @Inject(ApplicationViewService)
    private readonly applicationViewService: ApplicationViewService,
    @Inject(EmailService)
    private readonly emailService: EmailService
  ) {}

  async getProfile(authorizationHeader: string | undefined) {
    return this.authService.getProfile(authorizationHeader);
  }

  async listApplications(authorizationHeader: string | undefined, tenantId: string, filters: Record<string, string | undefined>) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const applications = await this.applicationRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
      relations: { pageData: true, form: true }
    });

    let items = applications.map((application) => ({
      applicationId: application.id,
      trackingCode: application.publicTrackingCode,
      formKey: application.form.key,
      status: application.status,
      unreadByStaff: application.unreadByStaff,
      createdAt: application.createdAt.toISOString(),
      customerSummary: this.applicationViewService.buildCustomerSummary(application.pageData)
    }));

    if (filters.status) {
      items = items.filter((item) => item.status === filters.status);
    }

    if (filters.unread === "true") {
      items = items.filter((item) => item.unreadByStaff);
    }

    if (filters.formKey) {
      items = items.filter((item) => item.formKey === filters.formKey);
    }

    return {
      items,
      page: 1,
      pageSize: items.length,
      total: items.length
    };
  }

  async getApplicationDetail(authorizationHeader: string | undefined, tenantId: string, applicationId: string) {
    const context = await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const application = await this.findApplicationForTenant(tenantId, applicationId);
    const { effectiveSchema } = await this.effectiveFormService.resolveByApplication(application);
    const appointment = await this.appointmentRepository.findOne({
      where: { applicationId },
      order: { createdAt: "DESC" }
    });
    const attachments = await this.attachmentRepository.find({
      where: { applicationId },
      order: { uploadedAt: "DESC" }
    });
    const summary = this.applicationViewService.buildSummary(effectiveSchema, application.pageData);
    const auditEntries = await this.applicationAuditLogRepository.find({
      where: { applicationId },
      order: { changedAt: "DESC" }
    });

    return {
      applicationId: application.id,
      tenantId: application.tenantId,
      trackingCode: application.publicTrackingCode,
      formKey: application.form.key,
      status: application.status,
      unreadByStaff: application.unreadByStaff,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.lastActivityAt.toISOString(),
      customerSummary: this.applicationViewService.buildCustomerSummary(application.pageData),
      timeline: this.applicationViewService.buildTimeline(application, appointment),
      appointment,
      attachments: attachments.map((item) => ({
        attachmentId: item.id,
        categoryKey: item.categoryKey,
        fileName: item.fileName,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        status: item.status,
        uploadedAt: item.uploadedAt.toISOString()
      })),
      pageData: this.applicationViewService.buildPageDataMap(application.pageData),
      missingSummary: summary.missingSummary,
      auditLog: auditEntries.map((entry) => ({
        id: entry.id,
        createdAt: entry.changedAt.toISOString(),
        actorName: context.user.displayName,
        pageKey: entry.pageKey,
        fieldPath: entry.fieldPath,
        oldValue: entry.oldValueJson,
        newValue: entry.newValueJson,
        reason: entry.reason
      })),
      staffModifiedFields: [...new Set(auditEntries.map((entry) => entry.fieldPath))]
    };
  }

  async markRead(authorizationHeader: string | undefined, tenantId: string, applicationId: string) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const application = await this.findApplicationForTenant(tenantId, applicationId);
    application.unreadByStaff = false;
    await this.applicationRepository.save(application);

    return { ok: true };
  }

  async editPage(authorizationHeader: string | undefined, tenantId: string, applicationId: string, pageKey: string, body: UpdateStaffPageDto) {
    const context = await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const application = await this.findApplicationForTenant(tenantId, applicationId);
    const { effectiveSchema } = await this.effectiveFormService.resolveByApplication(application);
    const page = this.effectiveFormService.getPageOrThrow(effectiveSchema, pageKey);
    const existingPageData = await this.applicationPageDataRepository.findOne({
      where: { applicationId, pageKey }
    });
    const mergedData = { ...(existingPageData?.dataJson ?? {}) };

    const auditEntries = body.edits.map((edit) => {
      const fieldKey = edit.fieldPath.split(".").at(-1) ?? edit.fieldPath;
      const oldValue = mergedData[fieldKey];
      mergedData[fieldKey] = edit.newValue;

      return this.applicationAuditLogRepository.create({
        id: randomUUID(),
        applicationId,
        changedAt: new Date(),
        changedByUserId: context.user.id,
        changedByActorType: "STAFF",
        pageKey,
        fieldPath: edit.fieldPath,
        oldValueJson: oldValue ?? null,
        newValueJson: edit.newValue,
        reason: edit.reason ?? null
      });
    });

    const validation = this.pageValidationService.validatePage(page, mergedData);

    if (validation.hardMissing.length > 0) {
      throw new ApiValidationException(validation.hardMissing);
    }

    const now = new Date();

    await this.applicationPageDataRepository.save(
      this.applicationPageDataRepository.create({
        id: existingPageData?.id ?? randomUUID(),
        applicationId,
        pageKey,
        dataJson: mergedData,
        softMissingJson: validation.softMissing,
        hardMissingJson: validation.hardMissing,
        updatedAt: now,
        updatedByActorType: "STAFF",
        updatedByUserId: context.user.id
      })
    );

    await this.applicationAuditLogRepository.save(auditEntries);

    application.lastActivityAt = now;
    application.unreadByStaff = false;
    await this.applicationRepository.save(application);

    return {
      ok: true,
      applicationId,
      pageKey,
      validation
    };
  }

  async getAuditLog(authorizationHeader: string | undefined, tenantId: string, applicationId: string) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    await this.findApplicationForTenant(tenantId, applicationId);
    const items = await this.applicationAuditLogRepository.find({
      where: { applicationId },
      order: { changedAt: "DESC" }
    });

    return {
      items: items.map((entry) => ({
        id: entry.id,
        changedAt: entry.changedAt.toISOString(),
        changedByUserId: entry.changedByUserId,
        changedByActorType: entry.changedByActorType,
        pageKey: entry.pageKey,
        fieldPath: entry.fieldPath,
        oldValue: entry.oldValueJson,
        newValue: entry.newValueJson,
        reason: entry.reason
      }))
    };
  }

  async transitionStatus(authorizationHeader: string | undefined, tenantId: string, applicationId: string, body: TransitionApplicationDto) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const application = await this.findApplicationForTenant(tenantId, applicationId);

    if (!this.isTransitionAllowed(application.status, body.toStatus)) {
      throw new ApiConflictException(`Transition ${application.status} -> ${body.toStatus} is not allowed`);
    }

    if (["UNDER_REVIEW", "SCHEDULED", "IN_PROGRESS"].includes(body.toStatus) && application.status === "SUBMITTED_INCOMPLETE") {
      throw new ApiConflictException("Incomplete applications cannot enter processing statuses");
    }

    application.status = body.toStatus;
    application.isLockedForCustomer = this.isLockedForCustomer(body.toStatus);
    application.lastActivityAt = new Date();
    application.completedAt = body.toStatus === "COMPLETED" ? new Date() : application.completedAt;
    application.timelineJson = this.applicationViewService.appendTimeline(application, body.toStatus, body.note);
    await this.applicationRepository.save(application);

    return {
      applicationId: application.id,
      status: application.status,
      timeline: application.timelineJson
    };
  }

  async scheduleAppointment(authorizationHeader: string | undefined, tenantId: string, applicationId: string, body: ScheduleAppointmentDto) {
    const context = await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const application = await this.findApplicationForTenant(tenantId, applicationId);

    if (application.status === "SUBMITTED_INCOMPLETE") {
      throw new ApiConflictException("Incomplete applications cannot be scheduled");
    }

    const appointment = await this.appointmentRepository.save(
      this.appointmentRepository.create({
        id: randomUUID(),
        applicationId,
        scheduledAt: new Date(body.scheduledAt),
        timezone: "Europe/Berlin",
        scheduledByUserId: context.user.id,
        notes: body.notes ?? ""
      })
    );

    application.status = "SCHEDULED";
    application.isLockedForCustomer = true;
    application.lastActivityAt = new Date();
    application.timelineJson = this.applicationViewService.appendTimeline(application, "SCHEDULED", body.notes ?? body.scheduledAt);
    await this.applicationRepository.save(application);

    return {
      applicationId,
      status: application.status,
      appointment: {
        id: appointment.id,
        scheduledAt: appointment.scheduledAt.toISOString(),
        notes: appointment.notes
      }
    };
  }

  async listNotifications(authorizationHeader: string | undefined, tenantId: string) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const applications = await this.applicationRepository.find({
      where: { tenantId, unreadByStaff: true },
      order: { createdAt: "DESC" },
      relations: { pageData: true, form: true }
    });

    const items = applications.map((application) => ({
      id: application.id,
      kind: "new_application",
      createdAt: application.createdAt.toISOString(),
      label: `${this.applicationViewService.buildCustomerSummary(application.pageData).name} submitted ${application.form.key}`,
      applicationId: application.id
    }));

    return {
      unreadCount: items.length,
      items
    };
  }

  async listInvitations(authorizationHeader: string | undefined, tenantId: string) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const items = await this.invitationRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" }
    });

    return {
      items: items.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.roleKey,
        status: invitation.status.toLowerCase(),
        sentAt: invitation.createdAt.toISOString()
      }))
    };
  }

  async createInvitation(authorizationHeader: string | undefined, tenantId: string, body: CreateInvitationDto) {
    const context = await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new ApiResourceNotFoundException("Tenant not found");
    }

    const email = body.email.trim().toLowerCase();
    const existingPendingInvitation = await this.invitationRepository.findOne({
      where: {
        tenantId,
        email,
        status: "PENDING"
      }
    });

    if (existingPendingInvitation && existingPendingInvitation.expiresAt.getTime() > Date.now()) {
      throw new ApiConflictException("A pending invitation already exists for this email address.");
    }

    const invitation = this.invitationRepository.create({
      id: randomUUID(),
      tenantId,
      email,
      roleKey: body.role,
      tokenHash: randomUUID(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      status: "PENDING",
      acceptedAt: null
    });

    await this.emailService.sendInvitationEmail({
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      inviteId: invitation.id,
      invitedBy: context.user.displayName,
      role: invitation.roleKey,
      tenantName: tenant.name
    });

    await this.invitationRepository.save(invitation);

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.roleKey,
      status: invitation.status.toLowerCase(),
      sentAt: invitation.createdAt.toISOString()
    };
  }

  async getTheme(authorizationHeader: string | undefined, tenantId: string) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new ApiResourceNotFoundException("Tenant not found");
    }

    return tenant.themeJson as unknown as ThemeConfig;
  }

  async updateTheme(authorizationHeader: string | undefined, tenantId: string, theme: ThemeConfig) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new ApiResourceNotFoundException("Tenant not found");
    }

    tenant.themeJson = theme as unknown as Record<string, unknown>;
    await this.tenantRepository.save(tenant);
    return tenant.themeJson;
  }

  async listForms(authorizationHeader: string | undefined, tenantId: string) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const forms = await this.formDefinitionRepository.find({
      where: { tenantId, isPublished: true },
      order: { key: "ASC" }
    });

    return {
      items: forms.map((form) => ({
        formId: form.id,
        titleI18nKey: form.titleI18nKey
      }))
    };
  }

  async getFormOverride(authorizationHeader: string | undefined, tenantId: string, formId: string) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    await this.findFormForTenant(tenantId, formId);
    const baseForm = await this.effectiveFormService.resolveBaseFormForPublicForm(formId);
    const override = await this.formOverrideRepository.findOne({
      where: {
        tenantId,
        baseFormId: baseForm.id
      }
    });

    return {
      formId,
      operations: (override?.operationsJson ?? []) as FormOverrideOperation[]
    };
  }

  async updateFormOverride(authorizationHeader: string | undefined, tenantId: string, formId: string, body: UpdateFormOverrideDto) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    await this.findFormForTenant(tenantId, formId);
    const baseForm = await this.effectiveFormService.resolveBaseFormForPublicForm(formId);
    const existing = await this.formOverrideRepository.findOne({
      where: {
        tenantId,
        baseFormId: baseForm.id
      }
    });

    const saved = await this.formOverrideRepository.save(
      this.formOverrideRepository.create({
        id: existing?.id ?? randomUUID(),
        tenantId,
        baseFormId: baseForm.id,
        operationsJson: body.operations
      })
    );

    return {
      formId,
      operations: saved.operationsJson as FormOverrideOperation[]
    };
  }

  async exportApplicationsCsv(authorizationHeader: string | undefined, tenantId: string) {
    await this.authService.requireStaffContext(authorizationHeader, tenantId);
    const applications = await this.applicationRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
      relations: { pageData: true }
    });

    const lines = [
      ["applicationId", "trackingCode", "status", "createdAt", "customerName", "customerAddress"].join(",")
    ];

    for (const application of applications) {
      const customerSummary = this.applicationViewService.buildCustomerSummary(application.pageData);
      lines.push(
        [
          application.id,
          application.publicTrackingCode ?? "",
          application.status,
          application.createdAt.toISOString(),
          this.escapeCsv(customerSummary.name),
          this.escapeCsv(customerSummary.address)
        ].join(",")
      );
    }

    return lines.join("\n");
  }

  private escapeCsv(value: string) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  private async findApplicationForTenant(tenantId: string, applicationId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: { form: true, pageData: true }
    });

    if (!application) {
      throw new ApiResourceNotFoundException("Application not found");
    }

    if (application.tenantId !== tenantId) {
      throw new ApiTenantIsolationException();
    }

    return application;
  }

  private async findFormForTenant(tenantId: string, formId: string) {
    const form = await this.formDefinitionRepository.findOne({
      where: { id: formId }
    });

    if (!form) {
      throw new ApiResourceNotFoundException("Form not found");
    }

    if (form.tenantId !== tenantId) {
      throw new ApiTenantIsolationException();
    }

    return form;
  }

  private isLockedForCustomer(status: string) {
    return ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status);
  }

  private isTransitionAllowed(fromStatus: string, toStatus: string) {
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ["SUBMITTED_INCOMPLETE", "SUBMITTED_COMPLETE", "CANCELLED"],
      SUBMITTED_INCOMPLETE: ["SUBMITTED_COMPLETE", "CANCELLED"],
      SUBMITTED_COMPLETE: ["UNDER_REVIEW", "CANCELLED"],
      UNDER_REVIEW: ["SCHEDULED", "CANCELLED"],
      SCHEDULED: ["IN_PROGRESS"],
      IN_PROGRESS: ["COMPLETED"]
    };

    return allowedTransitions[fromStatus]?.includes(toStatus) ?? false;
  }
}
