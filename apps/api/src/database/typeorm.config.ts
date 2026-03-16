import { type DataSourceOptions } from "typeorm";

import { ApplicationAuditLogEntity } from "./entities/application-audit-log.entity";
import { ApplicationEntity } from "./entities/application.entity";
import { ApplicationPageDataEntity } from "./entities/application-page-data.entity";
import { AttachmentEntity } from "./entities/attachment.entity";
import { AppointmentEntity } from "./entities/appointment.entity";
import { FormDefinitionEntity } from "./entities/form-definition.entity";
import { FormOverrideEntity } from "./entities/form-override.entity";
import { InvitationEntity } from "./entities/invitation.entity";
import { TenantEntity } from "./entities/tenant.entity";
import { TenantUserEntity } from "./entities/tenant-user.entity";
import { UserEntity } from "./entities/user.entity";
import { CreatePublicApplicationsTables1710000000000 } from "./migrations/1710000000000-create-public-applications-tables";
import { AddBackofficeAuthAndWorkflowTables1710000001000 } from "./migrations/1710000001000-add-backoffice-auth-and-workflow-tables";
import { AddAttachmentsTable1710000002000 } from "./migrations/1710000002000-add-attachments-table";

export const databaseArtifacts = {
  entities: [
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
  ],
  migrations: [
    CreatePublicApplicationsTables1710000000000,
    AddBackofficeAuthAndWorkflowTables1710000001000,
    AddAttachmentsTable1710000002000
  ]
};

export function createApiDataSourceOptions(overrides: Partial<DataSourceOptions> = {}): DataSourceOptions {
  return {
    ...overrides,
    type: "postgres",
    host: process.env.API_DB_HOST ?? "127.0.0.1",
    port: Number(process.env.API_DB_PORT ?? 5432),
    username: process.env.API_DB_USER ?? "postgres",
    password: process.env.API_DB_PASSWORD ?? "postgres",
    database: process.env.API_DB_NAME ?? "sdt_210_5",
    logging: false,
    synchronize: false,
    migrationsRun: false,
    entities: databaseArtifacts.entities,
    migrations: databaseArtifacts.migrations
  } as DataSourceOptions;
}
