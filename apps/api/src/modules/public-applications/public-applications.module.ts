import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ApplicationEntity } from "../../database/entities/application.entity";
import { ApplicationPageDataEntity } from "../../database/entities/application-page-data.entity";
import { FormDefinitionEntity } from "../../database/entities/form-definition.entity";
import { FormOverrideEntity } from "../../database/entities/form-override.entity";
import { TenantEntity } from "../../database/entities/tenant.entity";
import { PublicApplicationsController } from "./public-applications.controller";
import { EffectiveFormService } from "./services/effective-form.service";
import { PageValidationService } from "./services/page-validation.service";
import { PublicDemoSeedService } from "./services/public-demo-seed.service";
import { PublicApplicationsService } from "./services/public-applications.service";

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity, ApplicationPageDataEntity, FormDefinitionEntity, FormOverrideEntity, TenantEntity])],
  controllers: [PublicApplicationsController],
  providers: [EffectiveFormService, PageValidationService, PublicApplicationsService, PublicDemoSeedService]
})
export class PublicApplicationsModule {}
