import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ApplicationEntity } from "../../database/entities/application.entity";
import { ApplicationPageDataEntity } from "../../database/entities/application-page-data.entity";
import { FormDefinitionEntity } from "../../database/entities/form-definition.entity";
import { FormOverrideEntity } from "../../database/entities/form-override.entity";
import { PublicApplicationsController } from "./public-applications.controller";
import { EffectiveFormService } from "./services/effective-form.service";
import { PageValidationService } from "./services/page-validation.service";
import { PublicApplicationsService } from "./services/public-applications.service";

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity, ApplicationPageDataEntity, FormDefinitionEntity, FormOverrideEntity])],
  controllers: [PublicApplicationsController],
  providers: [EffectiveFormService, PageValidationService, PublicApplicationsService]
})
export class PublicApplicationsModule {}
