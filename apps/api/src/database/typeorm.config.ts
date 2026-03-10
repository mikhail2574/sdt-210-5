import { type DataSourceOptions } from "typeorm";

import { ApplicationEntity } from "./entities/application.entity";
import { ApplicationPageDataEntity } from "./entities/application-page-data.entity";
import { FormDefinitionEntity } from "./entities/form-definition.entity";
import { FormOverrideEntity } from "./entities/form-override.entity";
import { TenantEntity } from "./entities/tenant.entity";
import { CreatePublicApplicationsTables1710000000000 } from "./migrations/1710000000000-create-public-applications-tables";

export const databaseArtifacts = {
  entities: [TenantEntity, FormDefinitionEntity, FormOverrideEntity, ApplicationEntity, ApplicationPageDataEntity],
  migrations: [CreatePublicApplicationsTables1710000000000]
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
