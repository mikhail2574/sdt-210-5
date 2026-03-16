import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ApplicationAuditLogEntity } from "../../database/entities/application-audit-log.entity";
import { ApplicationEntity } from "../../database/entities/application.entity";
import { ApplicationPageDataEntity } from "../../database/entities/application-page-data.entity";
import { AttachmentEntity } from "../../database/entities/attachment.entity";
import { AppointmentEntity } from "../../database/entities/appointment.entity";
import { FormDefinitionEntity } from "../../database/entities/form-definition.entity";
import { FormOverrideEntity } from "../../database/entities/form-override.entity";
import { InvitationEntity } from "../../database/entities/invitation.entity";
import { TenantEntity } from "../../database/entities/tenant.entity";
import { TenantUserEntity } from "../../database/entities/tenant-user.entity";
import { UserEntity } from "../../database/entities/user.entity";
import { BackofficeAuthController } from "./backoffice-auth.controller";
import { BackofficeController } from "./backoffice.controller";
import { PublicApplicationsController } from "./public-applications.controller";
import { ApplicationViewService } from "./services/application-view.service";
import { AuthService } from "./services/auth.service";
import { BackofficeService } from "./services/backoffice.service";
import { EffectiveFormService } from "./services/effective-form.service";
import { PageValidationService } from "./services/page-validation.service";
import { PublicDemoSeedService } from "./services/public-demo-seed.service";
import { PublicApplicationsService } from "./services/public-applications.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      UserEntity,
      TenantUserEntity,
      InvitationEntity,
      FormDefinitionEntity,
      FormOverrideEntity,
      ApplicationEntity,
      ApplicationPageDataEntity,
      AttachmentEntity,
      ApplicationAuditLogEntity,
      AppointmentEntity
    ])
  ],
  controllers: [PublicApplicationsController, BackofficeAuthController, BackofficeController],
  providers: [
    EffectiveFormService,
    PageValidationService,
    ApplicationViewService,
    AuthService,
    PublicApplicationsService,
    BackofficeService,
    PublicDemoSeedService
  ]
})
export class PublicApplicationsModule {}
