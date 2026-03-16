import { randomUUID } from "node:crypto";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DataSource, Repository } from "typeorm";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";

import { ApiModule } from "../src/api.module";
import { ApplicationAuditLogEntity } from "../src/database/entities/application-audit-log.entity";
import { ApplicationEntity } from "../src/database/entities/application.entity";
import { ApplicationPageDataEntity } from "../src/database/entities/application-page-data.entity";
import { AttachmentEntity } from "../src/database/entities/attachment.entity";
import { AppointmentEntity } from "../src/database/entities/appointment.entity";
import { FormDefinitionEntity } from "../src/database/entities/form-definition.entity";
import { FormOverrideEntity } from "../src/database/entities/form-override.entity";
import { InvitationEntity } from "../src/database/entities/invitation.entity";
import { TenantEntity } from "../src/database/entities/tenant.entity";
import { TenantUserEntity } from "../src/database/entities/tenant-user.entity";
import { UserEntity } from "../src/database/entities/user.entity";
import { type FormSchema } from "../src/modules/public-applications/form-schema.types";
import { AuthService } from "../src/modules/public-applications/services/auth.service";

const tenantAId = randomUUID();
const tenantBId = randomUUID();
const baseFormId = randomUUID();
const publicFormAId = randomUUID();
const publicFormBId = randomUUID();
const overrideAId = randomUUID();
const draftApplicationId = randomUUID();
const submittedApplicationId = randomUUID();
const publicMismatchApplicationId = randomUUID();
const tenantBApplicationId = randomUUID();
const staffAUserId = randomUUID();
const staffBUserId = randomUUID();
const staffAMembershipId = randomUUID();
const staffBMembershipId = randomUUID();
const seededInvitationId = randomUUID();

const staffAPassword = "staffA-secret";
const staffBPassword = "staffB-secret";
const seededCustomerPassword = "CustomerPass!2026";
const seededTrackingCode = "P001-HA-00042";

function buildBaseSchema(): FormSchema {
  return {
    form: {
      key: "hausanschluss",
      titleI18nKey: "forms.hausanschluss.title",
      pages: [
        {
          key: "antragsdetails",
          order: 10,
          titleI18nKey: "pages.antragsdetails.title",
          sections: [
            {
              key: "details",
              titleI18nKey: "sections.details.title",
              blocks: [
                {
                  type: "field",
                  id: "selectedMedia",
                  fieldType: "checkbox_group",
                  bind: { path: "antragsdetails.selectedMedia" },
                  labelI18nKey: "fields.selectedMedia.label",
                  requirement: "required",
                  options: [
                    { id: "strom", labelI18nKey: "media.strom" },
                    { id: "gas", labelI18nKey: "media.gas" },
                    { id: "wasser", labelI18nKey: "media.wasser" }
                  ],
                  validation: { minItems: 1, maxItems: 3 }
                },
                {
                  type: "field",
                  id: "requestType",
                  fieldType: "radio_group",
                  bind: { path: "antragsdetails.requestType" },
                  labelI18nKey: "fields.requestType.label",
                  requirement: "required",
                  options: [
                    { id: "new_connection", labelI18nKey: "requestType.new" },
                    { id: "change_connection", labelI18nKey: "requestType.change" }
                  ]
                },
                {
                  type: "field",
                  id: "changeKind",
                  fieldType: "select",
                  bind: { path: "antragsdetails.changeKind" },
                  labelI18nKey: "fields.changeKind.label",
                  requirement: "required",
                  visibleWhen: {
                    all: [{ path: "antragsdetails.requestType", op: "equals", value: "change_connection" }]
                  },
                  options: [
                    { id: "anlagen_erweiterung", labelI18nKey: "changeKind.erweiterung" },
                    { id: "zusammenlegung", labelI18nKey: "changeKind.zusammenlegung" }
                  ]
                },
                {
                  type: "field",
                  id: "wunschtermin",
                  fieldType: "date",
                  bind: { path: "antragsdetails.wunschtermin" },
                  labelI18nKey: "fields.wunschtermin.label",
                  requirement: "required"
                },
                {
                  type: "field",
                  id: "message",
                  fieldType: "textarea",
                  bind: { path: "antragsdetails.message" },
                  labelI18nKey: "fields.message.label",
                  requirement: "optional",
                  validation: { maxLength: 255 }
                }
              ]
            }
          ]
        },
        {
          key: "anschlussort",
          order: 20,
          titleI18nKey: "pages.anschlussort.title",
          sections: [
            {
              key: "address",
              titleI18nKey: "sections.address.title",
              blocks: [
                {
                  type: "field",
                  id: "street",
                  fieldType: "text",
                  bind: { path: "anschlussort.street" },
                  labelI18nKey: "fields.street.label",
                  requirement: "required"
                },
                {
                  type: "field",
                  id: "houseNumber",
                  fieldType: "text",
                  bind: { path: "anschlussort.houseNumber" },
                  labelI18nKey: "fields.houseNumber.label",
                  requirement: "required"
                },
                {
                  type: "field",
                  id: "postalCode",
                  fieldType: "text",
                  bind: { path: "anschlussort.postalCode" },
                  labelI18nKey: "fields.postalCode.label",
                  requirement: "required"
                },
                {
                  type: "field",
                  id: "city",
                  fieldType: "text",
                  bind: { path: "anschlussort.city" },
                  labelI18nKey: "fields.city.label",
                  requirement: "required"
                }
              ]
            }
          ]
        },
        {
          key: "kontaktdaten",
          order: 30,
          titleI18nKey: "pages.kontaktdaten.title",
          sections: [
            {
              key: "contact",
              titleI18nKey: "sections.contact.title",
              blocks: [
                {
                  type: "field",
                  id: "firstName",
                  fieldType: "text",
                  bind: { path: "kontaktdaten.firstName" },
                  labelI18nKey: "fields.firstName.label",
                  requirement: "required"
                },
                {
                  type: "field",
                  id: "lastName",
                  fieldType: "text",
                  bind: { path: "kontaktdaten.lastName" },
                  labelI18nKey: "fields.lastName.label",
                  requirement: "required"
                },
                {
                  type: "field",
                  id: "email",
                  fieldType: "text",
                  bind: { path: "kontaktdaten.email" },
                  labelI18nKey: "fields.email.label",
                  requirement: "required"
                }
              ]
            }
          ]
        }
      ]
    }
  };
}

function binaryParser(response: any, callback: (error: Error | null, body: Buffer) => void) {
  const chunks: Buffer[] = [];
  response.on("data", (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  response.on("end", () => {
    callback(null, Buffer.concat(chunks));
  });
  response.on("error", (error: Error) => {
    callback(error, Buffer.alloc(0));
  });
}

describe("Public applications and backoffice API", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  let tenantRepository: Repository<TenantEntity>;
  let userRepository: Repository<UserEntity>;
  let tenantUserRepository: Repository<TenantUserEntity>;
  let invitationRepository: Repository<InvitationEntity>;
  let formDefinitionRepository: Repository<FormDefinitionEntity>;
  let formOverrideRepository: Repository<FormOverrideEntity>;
  let applicationRepository: Repository<ApplicationEntity>;
  let applicationPageDataRepository: Repository<ApplicationPageDataEntity>;
  let attachmentRepository: Repository<AttachmentEntity>;
  let applicationAuditLogRepository: Repository<ApplicationAuditLogEntity>;
  let appointmentRepository: Repository<AppointmentEntity>;
  const previousDisableSeed = process.env.API_DISABLE_DEMO_SEED;

  beforeAll(async () => {
    process.env.API_DISABLE_DEMO_SEED = "1";

    const database = newDb({ autoCreateForeignKeyIndices: true });

    database.public.registerFunction({ name: "current_database", implementation: () => "pg_mem" });
    database.public.registerFunction({ name: "version", implementation: () => "15.0" });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ApiModule.register({
          dataSourceOptions: {
            type: "postgres",
            database: "pg_mem"
          },
          dataSourceFactory: async (options) => {
            const pgMemDataSource = database.adapters.createTypeormDataSource(options);
            await pgMemDataSource.initialize();
            await pgMemDataSource.runMigrations();
            return pgMemDataSource;
          }
        })
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();

    dataSource = moduleRef.get(DataSource);
    authService = moduleRef.get(AuthService);
    tenantRepository = dataSource.getRepository(TenantEntity);
    userRepository = dataSource.getRepository(UserEntity);
    tenantUserRepository = dataSource.getRepository(TenantUserEntity);
    invitationRepository = dataSource.getRepository(InvitationEntity);
    formDefinitionRepository = dataSource.getRepository(FormDefinitionEntity);
    formOverrideRepository = dataSource.getRepository(FormOverrideEntity);
    applicationRepository = dataSource.getRepository(ApplicationEntity);
    applicationPageDataRepository = dataSource.getRepository(ApplicationPageDataEntity);
    attachmentRepository = dataSource.getRepository(AttachmentEntity);
    applicationAuditLogRepository = dataSource.getRepository(ApplicationAuditLogEntity);
    appointmentRepository = dataSource.getRepository(AppointmentEntity);
  });

  beforeEach(async () => {
    await applicationAuditLogRepository.createQueryBuilder().delete().execute();
    await appointmentRepository.createQueryBuilder().delete().execute();
    await attachmentRepository.createQueryBuilder().delete().execute();
    await applicationPageDataRepository.createQueryBuilder().delete().execute();
    await applicationRepository.createQueryBuilder().delete().execute();
    await invitationRepository.createQueryBuilder().delete().execute();
    await tenantUserRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
    await formOverrideRepository.createQueryBuilder().delete().execute();
    await formDefinitionRepository.createQueryBuilder().delete().execute();
    await tenantRepository.createQueryBuilder().delete().execute();

    await tenantRepository.save([
      tenantRepository.create({ id: tenantAId, code: "P001", name: "Tenant A", themeJson: { palette: { primary: "#0057B8" } }, isActive: true }),
      tenantRepository.create({ id: tenantBId, code: "P002", name: "Tenant B", themeJson: { palette: { primary: "#111111" } }, isActive: true })
    ]);

    await formDefinitionRepository.save([
      formDefinitionRepository.create({
        id: baseFormId,
        tenantId: null,
        key: "hausanschluss",
        titleI18nKey: "forms.hausanschluss.title",
        schemaJson: buildBaseSchema() as unknown as Record<string, unknown>,
        isPublished: true,
        version: 1
      }),
      formDefinitionRepository.create({
        id: publicFormAId,
        tenantId: tenantAId,
        key: "hausanschluss",
        titleI18nKey: "forms.hausanschluss.title",
        schemaJson: {} as Record<string, unknown>,
        isPublished: true,
        version: 1
      }),
      formDefinitionRepository.create({
        id: publicFormBId,
        tenantId: tenantBId,
        key: "hausanschluss",
        titleI18nKey: "forms.hausanschluss.title",
        schemaJson: {} as Record<string, unknown>,
        isPublished: true,
        version: 1
      })
    ]);

    await formOverrideRepository.save(
      formOverrideRepository.create({
        id: overrideAId,
        tenantId: tenantAId,
        baseFormId,
        operationsJson: [
          {
            op: "updateRequirement",
            target: { pageKey: "antragsdetails", fieldId: "message" },
            value: "soft_required"
          }
        ]
      })
    );

    const [staffAPasswordHash, staffBPasswordHash, customerPasswordHash] = await Promise.all([
      authService.hashPassword(staffAPassword),
      authService.hashPassword(staffBPassword),
      authService.hashPassword(seededCustomerPassword)
    ]);

    await userRepository.save([
      userRepository.create({
        id: staffAUserId,
        email: "staff-a@example.test",
        passwordHash: staffAPasswordHash,
        displayName: "Tenant A Staff",
        isPlatformAdmin: false,
        lastLoginAt: null
      }),
      userRepository.create({
        id: staffBUserId,
        email: "staff-b@example.test",
        passwordHash: staffBPasswordHash,
        displayName: "Tenant B Staff",
        isPlatformAdmin: false,
        lastLoginAt: null
      })
    ]);

    await tenantUserRepository.save([
      tenantUserRepository.create({
        id: staffAMembershipId,
        tenantId: tenantAId,
        userId: staffAUserId,
        roleKey: "TENANT_ADMIN",
        permissionsJson: {}
      }),
      tenantUserRepository.create({
        id: staffBMembershipId,
        tenantId: tenantBId,
        userId: staffBUserId,
        roleKey: "TENANT_ADMIN",
        permissionsJson: {}
      })
    ]);

    await invitationRepository.save(
      invitationRepository.create({
        id: seededInvitationId,
        tenantId: tenantAId,
        email: "installer@example.test",
        roleKey: "INSTALLATEUR",
        tokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        status: "PENDING",
        acceptedAt: null
      })
    );

    await applicationRepository.save([
      applicationRepository.create({
        id: draftApplicationId,
        tenantId: tenantAId,
        formId: publicFormAId,
        publicTrackingCode: null,
        customerAccessPasswordHash: null,
        status: "DRAFT",
        currentStepKey: "antragsdetails",
        isLockedForCustomer: false,
        unreadByStaff: true,
        submittedAt: null,
        lastActivityAt: new Date("2026-03-01T09:00:00.000Z"),
        completedAt: null,
        timelineJson: [
          {
            status: "DRAFT",
            at: "2026-03-01T09:00:00.000Z",
            note: "Draft created"
          }
        ]
      }),
      applicationRepository.create({
        id: submittedApplicationId,
        tenantId: tenantAId,
        formId: publicFormAId,
        publicTrackingCode: seededTrackingCode,
        customerAccessPasswordHash: customerPasswordHash,
        status: "SUBMITTED_COMPLETE",
        currentStepKey: "kontaktdaten",
        isLockedForCustomer: false,
        unreadByStaff: true,
        submittedAt: new Date("2026-03-02T10:30:00.000Z"),
        lastActivityAt: new Date("2026-03-02T10:30:00.000Z"),
        completedAt: null,
        timelineJson: [
          {
            status: "DRAFT",
            at: "2026-03-02T09:45:00.000Z",
            note: "Draft created"
          },
          {
            status: "SUBMITTED_COMPLETE",
            at: "2026-03-02T10:30:00.000Z",
            note: "Application submitted"
          }
        ]
      }),
      applicationRepository.create({
        id: publicMismatchApplicationId,
        tenantId: tenantBId,
        formId: publicFormAId,
        publicTrackingCode: null,
        customerAccessPasswordHash: null,
        status: "DRAFT",
        currentStepKey: "antragsdetails",
        isLockedForCustomer: false,
        unreadByStaff: true,
        submittedAt: null,
        lastActivityAt: new Date("2026-03-03T08:00:00.000Z"),
        completedAt: null,
        timelineJson: []
      }),
      applicationRepository.create({
        id: tenantBApplicationId,
        tenantId: tenantBId,
        formId: publicFormBId,
        publicTrackingCode: "P002-HA-00001",
        customerAccessPasswordHash: customerPasswordHash,
        status: "SUBMITTED_COMPLETE",
        currentStepKey: "kontaktdaten",
        isLockedForCustomer: false,
        unreadByStaff: true,
        submittedAt: new Date("2026-03-03T09:00:00.000Z"),
        lastActivityAt: new Date("2026-03-03T09:00:00.000Z"),
        completedAt: null,
        timelineJson: []
      })
    ]);

    await applicationPageDataRepository.save([
      applicationPageDataRepository.create({
        id: randomUUID(),
        applicationId: submittedApplicationId,
        pageKey: "antragsdetails",
        dataJson: {
          selectedMedia: ["strom"],
          requestType: "new_connection",
          wunschtermin: "2026-03-18",
          message: "Customer note"
        },
        softMissingJson: [],
        hardMissingJson: [],
        updatedAt: new Date("2026-03-02T10:10:00.000Z"),
        updatedByActorType: "CUSTOMER",
        updatedByUserId: null
      }),
      applicationPageDataRepository.create({
        id: randomUUID(),
        applicationId: submittedApplicationId,
        pageKey: "anschlussort",
        dataJson: {
          street: "Invalidenstrasse",
          houseNumber: "117",
          postalCode: "10115",
          city: "Berlin"
        },
        softMissingJson: [],
        hardMissingJson: [],
        updatedAt: new Date("2026-03-02T10:11:00.000Z"),
        updatedByActorType: "CUSTOMER",
        updatedByUserId: null
      }),
      applicationPageDataRepository.create({
        id: randomUUID(),
        applicationId: submittedApplicationId,
        pageKey: "kontaktdaten",
        dataJson: {
          firstName: "Anna",
          lastName: "Schneider",
          email: "anna.schneider@example.de"
        },
        softMissingJson: [],
        hardMissingJson: [],
        updatedAt: new Date("2026-03-02T10:12:00.000Z"),
        updatedByActorType: "CUSTOMER",
        updatedByUserId: null
      }),
      applicationPageDataRepository.create({
        id: randomUUID(),
        applicationId: tenantBApplicationId,
        pageKey: "kontaktdaten",
        dataJson: {
          firstName: "Berta",
          lastName: "TenantB",
          email: "berta@example.de"
        },
        softMissingJson: [],
        hardMissingJson: [],
        updatedAt: new Date("2026-03-03T09:00:00.000Z"),
        updatedByActorType: "CUSTOMER",
        updatedByUserId: null
      })
    ]);
  });

  afterAll(async () => {
    if (previousDisableSeed === undefined) {
      delete process.env.API_DISABLE_DEMO_SEED;
    } else {
      process.env.API_DISABLE_DEMO_SEED = previousDisableSeed;
    }

    await app.close();
  });

  it("returns effective runtime schema for a public form", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/public/forms/${publicFormAId}`)
      .expect(200);

    expect(response.body.formId).toBe(publicFormAId);
    expect(response.body.tenantId).toBe(tenantAId);
    expect(response.body.schema.form.pages).toHaveLength(3);

    const antragsdetailsPage = response.body.schema.form.pages.find((pageItem: { key: string }) => pageItem.key === "antragsdetails");
    const messageField = antragsdetailsPage.sections
      .flatMap((section: { blocks: Array<{ id: string }> }) => section.blocks)
      .find((block: { id: string }) => block.id === "message");

    expect(messageField.requirement).toBe("soft_required");
  });

  it("creates a draft, persists page data and returns softMissing from tenant override", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/public/forms/${publicFormAId}/applications:draft`)
      .send({
        pageKey: "antragsdetails",
        data: {
          selectedMedia: ["strom"],
          requestType: "new_connection",
          wunschtermin: "2026-03-20"
        }
      })
      .expect(201);

    expect(response.body.status).toBe("DRAFT");
    expect(response.body.nextPageKey).toBe("anschlussort");
    expect(response.body.validation.hardMissing).toEqual([]);
    expect(response.body.validation.softMissing).toEqual(["antragsdetails.message"]);

    const savedApplication = await applicationRepository.findOneByOrFail({ id: response.body.applicationId });
    const savedPageData = await applicationPageDataRepository.findOneByOrFail({
      applicationId: response.body.applicationId,
      pageKey: "antragsdetails"
    });

    expect(savedApplication.tenantId).toBe(tenantAId);
    expect(savedApplication.formId).toBe(publicFormAId);
    expect(savedPageData.dataJson).toEqual({
      selectedMedia: ["strom"],
      requestType: "new_connection",
      wunschtermin: "2026-03-20"
    });
    expect(savedPageData.softMissingJson).toEqual(["antragsdetails.message"]);
  });

  it("submits an incomplete draft, allows customer resume, and completes on resubmit", async () => {
    const saveDraftResponse = await request(app.getHttpServer())
      .put(`/api/public/applications/${draftApplicationId}/pages/antragsdetails`)
      .send({
        data: {
          selectedMedia: ["strom"],
          requestType: "new_connection",
          wunschtermin: "2026-04-01"
        }
      })
      .expect(200);

    expect(saveDraftResponse.body.validation.softMissing).toEqual(["antragsdetails.message"]);

    await request(app.getHttpServer())
      .put(`/api/public/applications/${draftApplicationId}/pages/anschlussort`)
      .send({
        data: {
          street: "Hauptstrasse",
          houseNumber: "5A",
          postalCode: "10115",
          city: "Berlin"
        }
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/public/applications/${draftApplicationId}/pages/kontaktdaten`)
      .send({
        data: {
          firstName: "Erika",
          lastName: "Mustermann",
          email: "erika@example.de"
        }
      })
      .expect(200);

    const summaryBeforeSubmit = await request(app.getHttpServer())
      .get(`/api/public/applications/${draftApplicationId}/summary`)
      .expect(200);

    expect(summaryBeforeSubmit.body.missingSummary.soft).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldPath: "antragsdetails.message", issue: "soft_required" })
      ])
    );

    const presignResponse = await request(app.getHttpServer())
      .post(`/api/public/applications/${draftApplicationId}/attachments:presign`)
      .send({
        categoryKey: "lageplan",
        fileName: "lageplan.pdf",
        mimeType: "application/pdf",
        sizeBytes: 123456
      })
      .expect(201);

    expect(presignResponse.body.upload.method).toBe("PUT");
    expect(presignResponse.body.upload.headers["Content-Type"]).toBe("application/pdf");

    const initialSubmitResponse = await request(app.getHttpServer())
      .post(`/api/public/applications/${draftApplicationId}:submit`)
      .send({
        consents: {
          privacyPolicyAccepted: true,
          dataProcessingAccepted: true,
          emailCommunicationAccepted: true,
          consentVersion: "2026-03-10",
          language: "de"
        }
      })
      .expect(201);

    expect(initialSubmitResponse.body.status).toBe("SUBMITTED_INCOMPLETE");
    expect(initialSubmitResponse.body.trackingCode).toMatch(/^P001-HA-/);
    expect(initialSubmitResponse.body.passwordIssued).toBe(true);
    expect(initialSubmitResponse.body.password).toMatch(/^Demo/);

    const loginResponse = await request(app.getHttpServer())
      .post("/api/public/auth/login")
      .send({
        trackingCode: initialSubmitResponse.body.trackingCode,
        password: initialSubmitResponse.body.password
      })
      .expect(201);

    expect(loginResponse.body.applicationId).toBe(draftApplicationId);
    expect(loginResponse.body.status).toBe("SUBMITTED_INCOMPLETE");

    await request(app.getHttpServer())
      .put(`/api/public/applications/${draftApplicationId}/pages/antragsdetails`)
      .send({
        data: {
          selectedMedia: ["strom"],
          requestType: "new_connection",
          wunschtermin: "2026-04-01",
          message: "Ready for installation"
        }
      })
      .expect(200);

    const secondSubmitResponse = await request(app.getHttpServer())
      .post(`/api/public/applications/${draftApplicationId}:submit`)
      .send({
        consents: {
          privacyPolicyAccepted: true,
          dataProcessingAccepted: true,
          emailCommunicationAccepted: true,
          consentVersion: "2026-03-10",
          language: "de"
        }
      })
      .expect(201);

    expect(secondSubmitResponse.body.status).toBe("SUBMITTED_COMPLETE");
    expect(secondSubmitResponse.body.passwordIssued).toBe(false);
    expect(secondSubmitResponse.body.password).toBeNull();

    const customerDetailResponse = await request(app.getHttpServer())
      .get(`/api/public/applications/${draftApplicationId}`)
      .expect(200);

    expect(customerDetailResponse.body.status).toBe("SUBMITTED_COMPLETE");
    expect(customerDetailResponse.body.attachments).toEqual([
      expect.objectContaining({
        attachmentId: presignResponse.body.attachmentId,
        categoryKey: "lageplan",
        fileName: "lageplan.pdf"
      })
    ]);
    expect(customerDetailResponse.body.availableActions.resume).toBe(false);
    expect(customerDetailResponse.body.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "SUBMITTED_INCOMPLETE" }),
        expect.objectContaining({ status: "SUBMITTED_COMPLETE" })
      ])
    );

    const pdfResponse = await request(app.getHttpServer())
      .get(`/api/public/applications/${draftApplicationId}/pdf`)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(pdfResponse.headers["content-type"]).toContain("application/pdf");
    expect((pdfResponse.body as Buffer).length).toBeGreaterThan(0);
  });

  it("denies page updates when application tenant does not match form tenant", async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/public/applications/${publicMismatchApplicationId}/pages/antragsdetails`)
      .send({
        data: {
          selectedMedia: ["strom"],
          requestType: "new_connection",
          wunschtermin: "2026-05-01"
        }
      })
      .expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("returns structured validation errors for required and hard validation failures", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/public/forms/${publicFormAId}/applications:draft`)
      .send({
        pageKey: "antragsdetails",
        data: {
          requestType: "change_connection",
          wunschtermin: "not-a-date"
        }
      })
      .expect(422);

    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        { path: "antragsdetails.selectedMedia", issue: "required", labelKey: "fields.selectedMedia.label", kind: "field" },
        { path: "antragsdetails.changeKind", issue: "required", labelKey: "fields.changeKind.label", kind: "field" },
        { path: "antragsdetails.wunschtermin", issue: "invalid_date", labelKey: "fields.wunschtermin.label", kind: "field" }
      ])
    );
  });

  it("supports staff backoffice processing, audit, scheduling, exports, and notifications", async () => {
    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "staff-a@example.test",
        password: staffAPassword
      })
      .expect(201);

    const accessToken = loginResponse.body.accessToken as string;
    expect(loginResponse.body.user.tenants).toEqual([
      {
        tenantId: tenantAId,
        role: "TENANT_ADMIN"
      }
    ]);

    await request(app.getHttpServer())
      .get("/api/me")
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe("staff-a@example.test");
      });

    const listResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/applications`)
      .query({ status: "SUBMITTED_COMPLETE" })
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(listResponse.body.items).toEqual([
      expect.objectContaining({
        applicationId: submittedApplicationId,
        status: "SUBMITTED_COMPLETE",
        trackingCode: seededTrackingCode
      })
    ]);

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/applications/${submittedApplicationId}`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(detailResponse.body.pageData.kontaktdaten.email).toBe("anna.schneider@example.de");
    expect(detailResponse.body.attachments).toEqual([]);

    await request(app.getHttpServer())
      .post(`/api/tenants/${tenantAId}/applications/${submittedApplicationId}:markRead`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(201);

    const editResponse = await request(app.getHttpServer())
      .patch(`/api/tenants/${tenantAId}/applications/${submittedApplicationId}/pages/kontaktdaten`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        edits: [
          {
            fieldPath: "kontaktdaten.email",
            newValue: "anna.updated@example.de",
            reason: "Customer confirmed corrected email"
          }
        ]
      })
      .expect(200);

    expect(editResponse.body.ok).toBe(true);

    const auditResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/applications/${submittedApplicationId}/audit`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(auditResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pageKey: "kontaktdaten",
          fieldPath: "kontaktdaten.email",
          reason: "Customer confirmed corrected email"
        })
      ])
    );

    await request(app.getHttpServer())
      .post(`/api/tenants/${tenantAId}/applications/${submittedApplicationId}:transition`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        toStatus: "UNDER_REVIEW",
        note: "Started review"
      })
      .expect(201);

    const appointmentResponse = await request(app.getHttpServer())
      .post(`/api/tenants/${tenantAId}/applications/${submittedApplicationId}/appointment`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        scheduledAt: "2026-03-17T10:00:00+01:00",
        notes: "Bring meter access plan"
      })
      .expect(201);

    expect(appointmentResponse.body.status).toBe("SCHEDULED");

    await request(app.getHttpServer())
      .post(`/api/tenants/${tenantAId}/applications/${submittedApplicationId}:transition`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        toStatus: "IN_PROGRESS",
        note: "Installer is on site"
      })
      .expect(201);

    const completedResponse = await request(app.getHttpServer())
      .post(`/api/tenants/${tenantAId}/applications/${submittedApplicationId}:transition`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        toStatus: "COMPLETED",
        note: "Connection finished"
      })
      .expect(201);

    expect(completedResponse.body.status).toBe("COMPLETED");

    const notificationsResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/notifications`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(notificationsResponse.body.unreadCount).toBeGreaterThanOrEqual(1);

    const exportResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/exports/applications.csv`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(exportResponse.text).toContain("applicationId,trackingCode,status,createdAt,customerName,customerAddress");
    expect(exportResponse.text).toContain(submittedApplicationId);
  });

  it("enforces tenant isolation for backoffice tokens and application access", async () => {
    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "staff-a@example.test",
        password: staffAPassword
      })
      .expect(201);

    const accessToken = loginResponse.body.accessToken as string;

    await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/applications/${tenantBApplicationId}`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/tenants/${tenantBId}/applications`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(403);
  });

  it("supports tenant admin configuration endpoints and invitation acceptance", async () => {
    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "staff-a@example.test",
        password: staffAPassword
      })
      .expect(201);

    const accessToken = loginResponse.body.accessToken as string;

    const themeResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/theme`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(themeResponse.body.palette.primary).toBe("#0057B8");

    await request(app.getHttpServer())
      .put(`/api/tenants/${tenantAId}/theme`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        tenantCode: "P001",
        logo: {
          url: "/updated-logo.svg",
          altI18nKey: "theme.logoAlt"
        },
        palette: {
          primary: "#123456",
          secondary: "#00356F",
          accent: "#F6A313",
          bg: "#F6F8FB",
          text: "#10213A",
          danger: "#B32020",
          warning: "#8A5A00"
        },
        typography: {
          fontFamily: "IBM Plex Sans",
          baseFontSizePx: 16
        }
      })
      .expect(200);

    const formsResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/forms`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(formsResponse.body.items).toEqual([
      expect.objectContaining({
        formId: publicFormAId
      })
    ]);

    const overrideResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/forms/${publicFormAId}/override`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(overrideResponse.body.operations).toEqual([
      expect.objectContaining({
        op: "updateRequirement"
      })
    ]);

    await request(app.getHttpServer())
      .put(`/api/tenants/${tenantAId}/forms/${publicFormAId}/override`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        operations: [
          {
            op: "updateRequirement",
            target: { pageKey: "antragsdetails", fieldId: "message" },
            value: "optional"
          }
        ]
      })
      .expect(200);

    const createdInvitation = await request(app.getHttpServer())
      .post(`/api/tenants/${tenantAId}/invitations`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        email: "new-installer@example.test",
        role: "INSTALLATEUR"
      })
      .expect(201);

    expect(createdInvitation.body.email).toBe("new-installer@example.test");

    const invitationsResponse = await request(app.getHttpServer())
      .get(`/api/tenants/${tenantAId}/invitations`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(invitationsResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdInvitation.body.id,
          email: "new-installer@example.test"
        })
      ])
    );

    const acceptInvitationResponse = await request(app.getHttpServer())
      .post(`/api/invitations/${createdInvitation.body.id}:accept`)
      .send({
        displayName: "New Installer",
        password: "InstallerPass!2026"
      })
      .expect(201);

    expect(acceptInvitationResponse.body.user.email).toBe("new-installer@example.test");
    expect(acceptInvitationResponse.body.user.role).toBe("INSTALLATEUR");

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "new-installer@example.test",
        password: "InstallerPass!2026"
      })
      .expect(201);
  });
});
