import { DynamicModule, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource, type DataSourceOptions } from "typeorm";

import { databaseArtifacts, createApiDataSourceOptions } from "./database/typeorm.config";
import { PublicApplicationsModule } from "./modules/public-applications/public-applications.module";

export type ApiModuleRegistrationOptions = {
  dataSourceOptions?: Partial<DataSourceOptions>;
  dataSourceFactory?: (options: DataSourceOptions) => Promise<DataSource>;
};

@Module({})
export class ApiModule {
  static register(options: ApiModuleRegistrationOptions = {}): DynamicModule {
    return {
      module: ApiModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: async () => createApiDataSourceOptions(options.dataSourceOptions),
          dataSourceFactory: async (typeormOptions) => {
            const resolvedOptions = typeormOptions as DataSourceOptions;

            if (options.dataSourceFactory) {
              return options.dataSourceFactory(resolvedOptions);
            }

            const dataSource = new DataSource({
              ...resolvedOptions,
              entities: databaseArtifacts.entities,
              migrations: databaseArtifacts.migrations
            });

            return dataSource.initialize();
          }
        }),
        PublicApplicationsModule
      ]
    };
  }
}
