import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { FormDefinitionEntity } from "../../../database/entities/form-definition.entity";
import { FormOverrideEntity } from "../../../database/entities/form-override.entity";
import { TenantEntity } from "../../../database/entities/tenant.entity";
import {
  demoBaseFormId,
  demoBaseSchema,
  demoMessageOverrideId,
  demoPublicFormId,
  demoSoftPublicFormId,
  demoTenantId,
  demoTheme,
  softDemoTenantId
} from "../demo/demo-form.constants";

@Injectable()
export class PublicDemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PublicDemoSeedService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(FormDefinitionEntity)
    private readonly formDefinitionRepository: Repository<FormDefinitionEntity>,
    @InjectRepository(FormOverrideEntity)
    private readonly formOverrideRepository: Repository<FormOverrideEntity>
  ) {}

  async onApplicationBootstrap() {
    if (process.env.API_DISABLE_DEMO_SEED === "1") {
      return;
    }

    await this.seedDemoData();
  }

  private async seedDemoData() {
    const existingDemoForm = await this.formDefinitionRepository.findOne({
      where: { id: demoPublicFormId }
    });

    if (existingDemoForm) {
      return;
    }

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

    this.logger.log(`Seeded demo public forms ${demoPublicFormId} and ${demoSoftPublicFormId}`);
  }
}
