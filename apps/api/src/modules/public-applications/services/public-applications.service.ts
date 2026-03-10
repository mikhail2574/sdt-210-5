import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ApplicationEntity } from "../../../database/entities/application.entity";
import { ApplicationPageDataEntity } from "../../../database/entities/application-page-data.entity";
import { ApiResourceNotFoundException, ApiTenantIsolationException, ApiValidationException } from "../errors/api-http.exceptions";
import { type CreateDraftDto } from "../dto/create-draft.dto";
import { type UpdatePageDto } from "../dto/update-page.dto";
import { EffectiveFormService } from "./effective-form.service";
import { PageValidationService } from "./page-validation.service";

@Injectable()
export class PublicApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationPageDataEntity)
    private readonly applicationPageDataRepository: Repository<ApplicationPageDataEntity>,
    @Inject(EffectiveFormService)
    private readonly effectiveFormService: EffectiveFormService,
    @Inject(PageValidationService)
    private readonly pageValidationService: PageValidationService
  ) {}

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
        completedAt: null
      })
    );

    await this.applicationPageDataRepository.save(
      this.applicationPageDataRepository.create({
        id: randomUUID(),
        applicationId: application.id,
        pageKey: body.pageKey,
        dataJson: body.data ?? {},
        softMissingJson: validation.softMissing,
        hardMissingJson: validation.hardMissing,
        updatedAt: now,
        updatedByActorType: "CUSTOMER",
        updatedByUserId: null
      })
    );

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
    const existingPageData = await this.applicationPageDataRepository.findOne({
      where: {
        applicationId,
        pageKey
      }
    });

    if (existingPageData) {
      existingPageData.dataJson = body.data ?? {};
      existingPageData.softMissingJson = validation.softMissing;
      existingPageData.hardMissingJson = validation.hardMissing;
      existingPageData.updatedAt = now;
      existingPageData.updatedByActorType = "CUSTOMER";
      existingPageData.updatedByUserId = null;
      await this.applicationPageDataRepository.save(existingPageData);
    } else {
      await this.applicationPageDataRepository.save(
        this.applicationPageDataRepository.create({
          id: randomUUID(),
          applicationId,
          pageKey,
          dataJson: body.data ?? {},
          softMissingJson: validation.softMissing,
          hardMissingJson: validation.hardMissing,
          updatedAt: now,
          updatedByActorType: "CUSTOMER",
          updatedByUserId: null
        })
      );
    }

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
}
