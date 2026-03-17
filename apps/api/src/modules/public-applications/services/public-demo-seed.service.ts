import { Inject, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ApplicationAuditLogEntity } from "../../../database/entities/application-audit-log.entity";
import { ApplicationEntity } from "../../../database/entities/application.entity";
import { ApplicationPageDataEntity } from "../../../database/entities/application-page-data.entity";
import { AppointmentEntity } from "../../../database/entities/appointment.entity";
import { FormDefinitionEntity } from "../../../database/entities/form-definition.entity";
import { FormOverrideEntity } from "../../../database/entities/form-override.entity";
import { InvitationEntity } from "../../../database/entities/invitation.entity";
import { TenantEntity } from "../../../database/entities/tenant.entity";
import { TenantUserEntity } from "../../../database/entities/tenant-user.entity";
import { UserEntity } from "../../../database/entities/user.entity";
import {
  demoApplicationAuditId,
  demoApplicationId,
  demoApplicationPageDataId,
  demoAppointmentId,
  demoBaseFormId,
  demoBaseSchema,
  demoInvitationId,
  demoMessageOverrideId,
  demoPublicFormId,
  demoStaffMembershipId,
  demoStaffUserId,
  demoSoftPublicFormId,
  demoTenantId,
  demoTheme,
  softDemoTenantId
} from "../demo/demo-form.constants";
import { AuthService } from "./auth.service";

@Injectable()
export class PublicDemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PublicDemoSeedService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(FormDefinitionEntity)
    private readonly formDefinitionRepository: Repository<FormDefinitionEntity>,
    @InjectRepository(FormOverrideEntity)
    private readonly formOverrideRepository: Repository<FormOverrideEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationPageDataEntity)
    private readonly applicationPageDataRepository: Repository<ApplicationPageDataEntity>,
    @InjectRepository(ApplicationAuditLogEntity)
    private readonly applicationAuditLogRepository: Repository<ApplicationAuditLogEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @Inject(AuthService)
    private readonly authService: AuthService
  ) {}

  async onApplicationBootstrap() {
    if (process.env.API_DISABLE_DEMO_SEED === "1") {
      return;
    }

    await this.seedDemoData();
  }

  private async seedDemoData() {
    const staffPasswordHash = await this.authService.hashPassword("demo12345");
    const customerPasswordHash = await this.authService.hashPassword("DemoPass!2026");
    const now = new Date();

    await this.tenantRepository.save(
      [
        this.tenantRepository.create({
          id: demoTenantId,
          code: "P001",
          name: "Demo Stadtwerke",
          themeJson: demoTheme as unknown as Record<string, unknown>,
          isActive: true
        }),
        this.tenantRepository.create({
          id: softDemoTenantId,
          code: "P001-SOFT",
          name: "Demo Stadtwerke Soft",
          themeJson: demoTheme as unknown as Record<string, unknown>,
          isActive: true
        })
      ]
    );

    await this.formDefinitionRepository.save([
      this.formDefinitionRepository.create({
        id: demoBaseFormId,
        tenantId: null,
        key: "hausanschluss",
        titleI18nKey: "forms.hausanschluss.title",
        schemaJson: demoBaseSchema as unknown as Record<string, unknown>,
        isPublished: true,
        version: 1
      }),
      this.formDefinitionRepository.create({
        id: demoPublicFormId,
        tenantId: demoTenantId,
        key: "hausanschluss",
        titleI18nKey: "forms.hausanschluss.title",
        schemaJson: {} as Record<string, unknown>,
        isPublished: true,
        version: 1
      }),
      this.formDefinitionRepository.create({
        id: demoSoftPublicFormId,
        tenantId: softDemoTenantId,
        key: "hausanschluss",
        titleI18nKey: "forms.hausanschluss.title",
        schemaJson: {} as Record<string, unknown>,
        isPublished: true,
        version: 1
      })
    ]);

    await this.formOverrideRepository.save(
      this.formOverrideRepository.create({
        id: demoMessageOverrideId,
        tenantId: softDemoTenantId,
        baseFormId: demoBaseFormId,
        operationsJson: [
          {
            op: "updateRequirement",
            target: {
              pageKey: "antragsdetails",
              fieldId: "message"
            },
            value: "soft_required"
          }
        ]
      })
    );

    await this.userRepository.save(
      this.userRepository.create({
        id: demoStaffUserId,
        email: "staff@stadtwerke.demo",
        passwordHash: staffPasswordHash,
        displayName: "Marta Becker",
        isPlatformAdmin: false,
        lastLoginAt: null
      })
    );

    await this.tenantUserRepository.save(
      [
        this.tenantUserRepository.create({
          id: demoStaffMembershipId,
          tenantId: demoTenantId,
          userId: demoStaffUserId,
          roleKey: "TENANT_ADMIN",
          permissionsJson: {}
        }),
        this.tenantUserRepository.create({
          id: "10000000-0000-4000-8000-000000000304",
          tenantId: softDemoTenantId,
          userId: demoStaffUserId,
          roleKey: "TENANT_ADMIN",
          permissionsJson: {}
        })
      ]
    );

    await this.invitationRepository.save(
      this.invitationRepository.create({
        id: demoInvitationId,
        tenantId: demoTenantId,
        email: "installateur@stadtwerke.demo",
        roleKey: "INSTALLATEUR",
        tokenHash: demoInvitationId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        status: "PENDING",
        acceptedAt: null
      })
    );

    await this.applicationRepository.save(
      this.applicationRepository.create({
        id: demoApplicationId,
        tenantId: demoTenantId,
        formId: demoPublicFormId,
        publicTrackingCode: "317-000-HA01016",
        customerAccessPasswordHash: customerPasswordHash,
        status: "SUBMITTED_INCOMPLETE",
        currentStepKey: "antragsdetails",
        isLockedForCustomer: false,
        unreadByStaff: true,
        submittedAt: new Date("2026-03-09T09:46:00.000Z"),
        lastActivityAt: new Date("2026-03-10T07:45:00.000Z"),
        completedAt: null,
        timelineJson: [
          {
            status: "DRAFT",
            at: "2026-03-09T09:15:00.000Z",
            note: "Draft created"
          },
          {
            status: "SUBMITTED_INCOMPLETE",
            at: "2026-03-09T09:46:00.000Z",
            note: "Submitted with missing soft-required fields"
          }
        ]
      })
    );

    await this.applicationPageDataRepository.save([
      this.applicationPageDataRepository.create({
        id: demoApplicationPageDataId,
        applicationId: demoApplicationId,
        pageKey: "antragsdetails",
        dataJson: {
          selectedMedia: ["strom", "wasser"],
          requestType: "change_connection",
          changeKind: "anlagen_erweiterung",
          wunschtermin: "2026-03-20",
          message: ""
        },
        softMissingJson: ["antragsdetails.message"],
        hardMissingJson: [],
        updatedAt: new Date("2026-03-09T09:46:00.000Z"),
        updatedByActorType: "CUSTOMER",
        updatedByUserId: null
      }),
      this.applicationPageDataRepository.create({
        id: "10000000-0000-4000-8000-000000000405",
        applicationId: demoApplicationId,
        pageKey: "anschlussort",
        dataJson: {
          postalCode: "10115",
          city: "Berlin",
          street: "Invalidenstrasse",
          houseNumber: "117"
        },
        softMissingJson: [],
        hardMissingJson: [],
        updatedAt: new Date("2026-03-09T09:41:00.000Z"),
        updatedByActorType: "CUSTOMER",
        updatedByUserId: null
      }),
      this.applicationPageDataRepository.create({
        id: "10000000-0000-4000-8000-000000000406",
        applicationId: demoApplicationId,
        pageKey: "kontaktdaten",
        dataJson: {
          firstName: "Anna",
          lastName: "Schneider",
          email: "anna.schneider@example.de"
        },
        softMissingJson: [],
        hardMissingJson: [],
        updatedAt: new Date("2026-03-09T09:42:00.000Z"),
        updatedByActorType: "CUSTOMER",
        updatedByUserId: null
      })
    ]);

    await this.applicationAuditLogRepository.save(
      this.applicationAuditLogRepository.create({
        id: demoApplicationAuditId,
        applicationId: demoApplicationId,
        changedAt: new Date("2026-03-10T07:50:00.000Z"),
        changedByUserId: demoStaffUserId,
        changedByActorType: "STAFF",
        pageKey: "kontaktdaten",
        fieldPath: "kontaktdaten.email",
        oldValueJson: "ana.schneider@example.de",
        newValueJson: "anna.schneider@example.de",
        reason: "Typo fix from phone confirmation"
      })
    );

    this.logger.log(`Seeded demo public forms ${demoPublicFormId} and ${demoSoftPublicFormId} at ${now.toISOString()}`);
  }
}
