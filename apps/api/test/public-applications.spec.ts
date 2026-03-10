import { randomUUID } from "node:crypto";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DataSource, Repository } from "typeorm";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";

import { ApiModule } from "../src/api.module";
import { ApplicationEntity } from "../src/database/entities/application.entity";
import { ApplicationPageDataEntity } from "../src/database/entities/application-page-data.entity";
import { FormDefinitionEntity } from "../src/database/entities/form-definition.entity";
import { FormOverrideEntity } from "../src/database/entities/form-override.entity";
import { TenantEntity } from "../src/database/entities/tenant.entity";
import { type FormSchema } from "../src/modules/public-applications/form-schema.types";

const tenantAId = randomUUID();
const tenantBId = randomUUID();
const baseFormId = randomUUID();
const publicFormAId = randomUUID();
const publicFormBId = randomUUID();
const overrideAId = randomUUID();
const applicationAId = randomUUID();
const crossTenantApplicationId = randomUUID();

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
                  requirement: "required",
                  options: [
                    { id: "strom", labelI18nKey: "media.strom" },
                    { id: "gas", labelI18nKey: "media.gas" }
                  ],
                  validation: { minItems: 1, maxItems: 2 }
                },
                {
                  type: "field",
                  id: "requestType",
                  fieldType: "radio_group",
                  bind: { path: "antragsdetails.requestType" },
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
                  requirement: "required"
                },
                {
                  type: "field",
                  id: "message",
                  fieldType: "textarea",
                  bind: { path: "antragsdetails.message" },
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
          sections: []
        }
      ]
    }
  };
}

describe("Public applications endpoints", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let tenantRepository: Repository<TenantEntity>;
  let formDefinitionRepository: Repository<FormDefinitionEntity>;
  let formOverrideRepository: Repository<FormOverrideEntity>;
  let applicationRepository: Repository<ApplicationEntity>;
  let applicationPageDataRepository: Repository<ApplicationPageDataEntity>;

  beforeAll(async () => {
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
    tenantRepository = dataSource.getRepository(TenantEntity);
    formDefinitionRepository = dataSource.getRepository(FormDefinitionEntity);
    formOverrideRepository = dataSource.getRepository(FormOverrideEntity);
    applicationRepository = dataSource.getRepository(ApplicationEntity);
    applicationPageDataRepository = dataSource.getRepository(ApplicationPageDataEntity);
  });

  beforeEach(async () => {
    await applicationPageDataRepository.createQueryBuilder().delete().execute();
    await applicationRepository.createQueryBuilder().delete().execute();
    await formOverrideRepository.createQueryBuilder().delete().execute();
    await formDefinitionRepository.createQueryBuilder().delete().execute();
    await tenantRepository.createQueryBuilder().delete().execute();

    const baseSchema = buildBaseSchema();

    await tenantRepository.save([
      tenantRepository.create({ id: tenantAId, code: "P001", name: "Tenant A", themeJson: {}, isActive: true }),
      tenantRepository.create({ id: tenantBId, code: "P002", name: "Tenant B", themeJson: {}, isActive: true })
    ]);

    await formDefinitionRepository.save([
      formDefinitionRepository.create({
        id: baseFormId,
        tenantId: null,
        key: "hausanschluss",
        titleI18nKey: "forms.hausanschluss.title",
        schemaJson: baseSchema as unknown as Record<string, unknown>,
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

    await applicationRepository.save([
      applicationRepository.create({
        id: applicationAId,
        tenantId: tenantAId,
        formId: publicFormAId,
        publicTrackingCode: null,
        customerAccessPasswordHash: null,
        status: "DRAFT",
        currentStepKey: "antragsdetails",
        isLockedForCustomer: false,
        unreadByStaff: true,
        submittedAt: null,
        lastActivityAt: new Date("2025-01-01T00:00:00.000Z"),
        completedAt: null
      }),
      applicationRepository.create({
        id: crossTenantApplicationId,
        tenantId: tenantBId,
        formId: publicFormAId,
        publicTrackingCode: null,
        customerAccessPasswordHash: null,
        status: "DRAFT",
        currentStepKey: "antragsdetails",
        isLockedForCustomer: false,
        unreadByStaff: true,
        submittedAt: null,
        lastActivityAt: new Date("2025-01-01T00:00:00.000Z"),
        completedAt: null
      })
    ]);
  });

  afterAll(async () => {
    await app.close();
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
    expect(savedApplication.lastActivityAt).toBeInstanceOf(Date);
    expect(savedPageData.dataJson).toEqual({
      selectedMedia: ["strom"],
      requestType: "new_connection",
      wunschtermin: "2026-03-20"
    });
    expect(savedPageData.softMissingJson).toEqual(["antragsdetails.message"]);
  });

  it("updates page data and refreshes lastActivityAt for an existing application", async () => {
    const previousActivity = (await applicationRepository.findOneByOrFail({ id: applicationAId })).lastActivityAt;

    const response = await request(app.getHttpServer())
      .put(`/api/public/applications/${applicationAId}/pages/antragsdetails`)
      .send({
        clientRevision: 2,
        data: {
          selectedMedia: ["gas"],
          requestType: "change_connection",
          changeKind: "anlagen_erweiterung",
          wunschtermin: "2026-04-01"
        }
      })
      .expect(200);

    expect(response.body.status).toBe("DRAFT");
    expect(response.body.validation.softMissing).toEqual(["antragsdetails.message"]);

    const savedApplication = await applicationRepository.findOneByOrFail({ id: applicationAId });
    const savedPageData = await applicationPageDataRepository.findOneByOrFail({
      applicationId: applicationAId,
      pageKey: "antragsdetails"
    });

    expect(savedApplication.lastActivityAt.getTime()).toBeGreaterThan(previousActivity.getTime());
    expect(savedPageData.dataJson).toEqual({
      selectedMedia: ["gas"],
      requestType: "change_connection",
      changeKind: "anlagen_erweiterung",
      wunschtermin: "2026-04-01"
    });
  });

  it("denies page updates when application tenant does not match form tenant", async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/public/applications/${crossTenantApplicationId}/pages/antragsdetails`)
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
        { path: "antragsdetails.selectedMedia", issue: "required" },
        { path: "antragsdetails.changeKind", issue: "required" },
        { path: "antragsdetails.wunschtermin", issue: "invalid_date" }
      ])
    );
  });
});
