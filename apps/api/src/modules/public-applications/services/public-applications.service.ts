import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ApplicationEntity } from "../../../database/entities/application.entity";
import { ApplicationPageDataEntity } from "../../../database/entities/application-page-data.entity";
import { AttachmentEntity } from "../../../database/entities/attachment.entity";
import { AppointmentEntity } from "../../../database/entities/appointment.entity";
import { TenantEntity } from "../../../database/entities/tenant.entity";
import { ApiConflictException, ApiResourceNotFoundException, ApiTenantIsolationException, ApiValidationException } from "../errors/api-http.exceptions";
import { type CreateDraftDto } from "../dto/create-draft.dto";
import { type PresignAttachmentDto } from "../dto/presign-attachment.dto";
import { type SubmitApplicationDto } from "../dto/submit-application.dto";
import { type UpdatePageDto } from "../dto/update-page.dto";
import { ApplicationViewService } from "./application-view.service";
import { AuthService } from "./auth.service";
import { EffectiveFormService } from "./effective-form.service";
import { PageValidationService } from "./page-validation.service";
import { type PageValidationResult, type PublicFormRuntime, type ThemeConfig } from "../form-schema.types";

@Injectable()
export class PublicApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationPageDataEntity)
    private readonly applicationPageDataRepository: Repository<ApplicationPageDataEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @Inject(EffectiveFormService)
    private readonly effectiveFormService: EffectiveFormService,
    @Inject(PageValidationService)
    private readonly pageValidationService: PageValidationService,
    @Inject(ApplicationViewService)
    private readonly applicationViewService: ApplicationViewService,
    @Inject(AuthService)
    private readonly authService: AuthService
  ) {}

  async getFormRuntime(formId: string): Promise<PublicFormRuntime> {
    const { publicForm, effectiveSchema } = await this.effectiveFormService.resolveByPublicFormId(formId);
    const tenant = await this.tenantRepository.findOne({
      where: { id: publicForm.tenantId! }
    });

    if (!tenant) {
      throw new ApiResourceNotFoundException("Tenant not found");
    }

    return {
      formId: publicForm.id,
      tenantId: publicForm.tenantId!,
      theme: this.resolveTheme(tenant),
      schema: effectiveSchema
    };
  }

  async createDraft(formId: string, body: CreateDraftDto) {
    const { publicForm, effectiveSchema } = await this.effectiveFormService.resolveByPublicFormId(formId);
    const page = this.effectiveFormService.getPageOrThrow(effectiveSchema, body.pageKey);
    const validation = this.pageValidationService.validatePage(page, body.data ?? {});

    if (validation.hardMissing.length > 0) {
      throw new ApiValidationException(validation.hardMissing);
    }

    const now = new Date();
    const application = await this.applicationRepository.save(
      this.applicationRepository.create({
        id: randomUUID(),
        tenantId: publicForm.tenantId!,
        formId: publicForm.id,
        publicTrackingCode: null,
        customerAccessPasswordHash: null,
        status: "DRAFT",
        currentStepKey: body.pageKey,
        isLockedForCustomer: false,
        unreadByStaff: true,
        submittedAt: null,
        lastActivityAt: now,
        completedAt: null,
        timelineJson: [
          {
            status: "DRAFT",
            at: now.toISOString(),
            note: "Draft created"
          }
        ]
      })
    );

    await this.upsertPageData(application.id, body.pageKey, body.data ?? {}, validation, now, "CUSTOMER", null);

    return {
      applicationId: application.id,
      trackingHint: "will be issued on submit",
      status: application.status,
      nextPageKey: this.effectiveFormService.getNextPageKey(effectiveSchema, body.pageKey),
      validation
    };
  }

  async savePage(applicationId: string, pageKey: string, body: UpdatePageDto) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: { form: true }
    });

    if (!application) {
      throw new ApiResourceNotFoundException("Application not found");
    }

    if (!this.isCustomerEditable(application.status)) {
      throw new ApiConflictException("Customer changes are locked for the current status");
    }

    const { publicForm, effectiveSchema } = await this.effectiveFormService.resolveByApplication(application);

    if (application.tenantId !== publicForm.tenantId) {
      throw new ApiTenantIsolationException();
    }

    const page = this.effectiveFormService.getPageOrThrow(effectiveSchema, pageKey);
    const validation = this.pageValidationService.validatePage(page, body.data ?? {});

    if (validation.hardMissing.length > 0) {
      throw new ApiValidationException(validation.hardMissing);
    }

    const now = new Date();
    await this.upsertPageData(applicationId, pageKey, body.data ?? {}, validation, now, "CUSTOMER", null);

    application.currentStepKey = pageKey;
    application.lastActivityAt = now;
    await this.applicationRepository.save(application);

    return {
      applicationId,
      status: application.status,
      nextPageKey: this.effectiveFormService.getNextPageKey(effectiveSchema, pageKey),
      validation
    };
  }

  async getSummary(applicationId: string) {
    const application = await this.loadApplication(applicationId);
    const { effectiveSchema } = await this.effectiveFormService.resolveByApplication(application);
    const summary = this.applicationViewService.buildSummary(effectiveSchema, application.pageData);

    return {
      applicationId: application.id,
      status: application.status,
      ...summary
    };
  }

  async presignAttachment(applicationId: string, body: PresignAttachmentDto) {
    const application = await this.loadApplication(applicationId);

    if (!this.isCustomerEditable(application.status)) {
      throw new ApiConflictException("Attachments can only be added while the application is editable");
    }

    const attachmentId = randomUUID();
    const now = new Date();
    const storageKey = `${application.tenantId}/${application.id}/${body.categoryKey}/${attachmentId}-${body.fileName}`;

    await this.attachmentRepository.save(
      this.attachmentRepository.create({
        id: attachmentId,
        tenantId: application.tenantId,
        applicationId: application.id,
        categoryKey: body.categoryKey,
        fileName: body.fileName,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        storageKey,
        status: "UPLOADED",
        uploadedAt: now
      })
    );

    return {
      upload: {
        method: "PUT",
        url: `https://storage.example.invalid/upload/${attachmentId}`,
        headers: {
          "Content-Type": body.mimeType
        },
        expiresAt: new Date(now.getTime() + 1000 * 60 * 15).toISOString()
      },
      attachmentId
    };
  }

  async submit(applicationId: string, body: SubmitApplicationDto) {
    const application = await this.loadApplication(applicationId);

    if (!this.isCustomerEditable(application.status)) {
      throw new ApiConflictException("Customer submit is not allowed for the current status");
    }

    const { effectiveSchema } = await this.effectiveFormService.resolveByApplication(application);
    const summary = this.applicationViewService.buildSummary(effectiveSchema, application.pageData);
    const consentErrors = this.validateConsents(body.consents ?? {});

    if (summary.missingSummary.hard.length > 0 || consentErrors.length > 0) {
      throw new ApiValidationException([
        ...summary.missingSummary.hard.map((item) => ({
          path: item.fieldPath,
          issue: item.issue,
          labelKey: item.labelKey
        })),
        ...consentErrors
      ]);
    }

    const now = new Date();
    const nextStatus = summary.missingSummary.soft.length > 0 || summary.missingSummary.attachments.length > 0 ? "SUBMITTED_INCOMPLETE" : "SUBMITTED_COMPLETE";
    const trackingCode = application.publicTrackingCode ?? (await this.generateTrackingCode(application.tenantId));
    const shouldIssuePassword = !application.customerAccessPasswordHash;
    const password = shouldIssuePassword ? this.generateCustomerPassword() : null;
    let passwordHash = application.customerAccessPasswordHash;

    if (shouldIssuePassword) {
      passwordHash = await this.authService.hashPassword(password ?? this.generateCustomerPassword());
    }

    const consentValidation: PageValidationResult = {
      hardMissing: [],
      softMissing: [],
      softMissingDetails: []
    };

    await this.upsertPageData(
      application.id,
      "rechtliche-hinweise",
      body.consents ?? {},
      consentValidation,
      now,
      "CUSTOMER",
      null
    );

    application.publicTrackingCode = trackingCode;
    application.customerAccessPasswordHash = passwordHash;
    application.status = nextStatus;
    application.submittedAt = application.submittedAt ?? now;
    application.lastActivityAt = now;
    application.currentStepKey = "rechtliche-hinweise";
    application.unreadByStaff = true;
    application.isLockedForCustomer = false;
    application.timelineJson = this.applicationViewService.appendTimeline(application, nextStatus, "Customer submitted the application");
    await this.applicationRepository.update(application.id, {
      publicTrackingCode: application.publicTrackingCode,
      customerAccessPasswordHash: application.customerAccessPasswordHash,
      status: application.status,
      submittedAt: application.submittedAt,
      lastActivityAt: application.lastActivityAt,
      currentStepKey: application.currentStepKey,
      unreadByStaff: application.unreadByStaff,
      isLockedForCustomer: application.isLockedForCustomer,
      timelineJson: application.timelineJson as never
    });

    return {
      status: nextStatus,
      trackingCode,
      passwordIssued: shouldIssuePassword,
      password,
      pdf: {
        applicationPdfReady: true
      }
    };
  }

  async getCustomerApplication(applicationId: string) {
    const application = await this.loadApplication(applicationId);
    const { effectiveSchema } = await this.effectiveFormService.resolveByApplication(application);
    const summary = this.applicationViewService.buildSummary(effectiveSchema, application.pageData);
    const attachments = await this.listAttachments(applicationId);
    const appointment = await this.appointmentRepository.findOne({
      where: { applicationId },
      order: { createdAt: "DESC" }
    });

    return {
      applicationId: application.id,
      formId: application.formId,
      status: application.status,
      currentPageKey: application.currentStepKey,
      trackingCode: application.publicTrackingCode,
      customerSummary: this.applicationViewService.buildCustomerSummary(application.pageData),
      timeline: this.applicationViewService.buildTimeline(application, appointment),
      attachments,
      missingSummary: summary.missingSummary,
      availableActions: {
        resume: this.isCustomerEditable(application.status),
        downloadPdf: application.publicTrackingCode !== null
      }
    };
  }

  async getApplicationPdf(applicationId: string) {
    const application = await this.loadApplication(applicationId);
    const customerSummary = this.applicationViewService.buildCustomerSummary(application.pageData);
    const content = `Application ${application.publicTrackingCode ?? application.id}\nStatus: ${application.status}\nCustomer: ${customerSummary.name}\nAddress: ${customerSummary.address}`;
    return this.buildPdfBuffer(content);
  }

  private resolveTheme(tenant: TenantEntity): ThemeConfig {
    return tenant.themeJson as unknown as ThemeConfig;
  }

  private async loadApplication(applicationId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: { form: true, pageData: true }
    });

    if (!application) {
      throw new ApiResourceNotFoundException("Application not found");
    }

    return application;
  }

  private async listAttachments(applicationId: string) {
    const items = await this.attachmentRepository.find({
      where: { applicationId },
      order: { uploadedAt: "DESC" }
    });

    return items.map((item) => ({
      attachmentId: item.id,
      categoryKey: item.categoryKey,
      fileName: item.fileName,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      status: item.status,
      uploadedAt: item.uploadedAt.toISOString()
    }));
  }

  private async upsertPageData(
    applicationId: string,
    pageKey: string,
    data: Record<string, unknown>,
    validation: PageValidationResult,
    updatedAt: Date,
    actorType: string,
    userId: string | null
  ) {
    const existingPageData = await this.applicationPageDataRepository.findOne({
      where: {
        applicationId,
        pageKey
      }
    });

    return this.applicationPageDataRepository.save(
      this.applicationPageDataRepository.create({
        id: existingPageData?.id ?? randomUUID(),
        applicationId,
        pageKey,
        dataJson: data,
        softMissingJson: validation.softMissing,
        hardMissingJson: validation.hardMissing,
        updatedAt,
        updatedByActorType: actorType,
        updatedByUserId: userId
      })
    );
  }

  private validateConsents(consents: Record<string, unknown>) {
    return [
      "privacyPolicyAccepted",
      "dataProcessingAccepted",
      "emailCommunicationAccepted"
    ]
      .filter((key) => consents[key] !== true)
      .map((key) => ({
        path: `rechtliche-hinweise.${key}`,
        issue: "required",
        labelKey: `fields.${key}.label`
      }));
  }

  private isCustomerEditable(status: string) {
    return ["DRAFT", "SUBMITTED_INCOMPLETE"].includes(status);
  }

  private async generateTrackingCode(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new ApiResourceNotFoundException("Tenant not found");
    }

    const totalApplications = await this.applicationRepository.count({
      where: { tenantId }
    });
    const sequence = String(totalApplications + 1).padStart(5, "0");
    return `${tenant.code}-HA-${sequence}`;
  }

  private generateCustomerPassword() {
    return `Demo${randomUUID().slice(0, 8)}!`;
  }

  private buildPdfBuffer(text: string) {
    const safeText = text.replace(/[()\\]/g, "");
    const stream = `BT /F1 12 Tf 40 760 Td (${safeText}) Tj ET`;
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
      `5 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf));
      pdf += object;
    }

    const startXref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (let index = 1; index < offsets.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
    return Buffer.from(pdf, "utf8");
  }
}
