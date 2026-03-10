import "reflect-metadata";

import { DataSource } from "typeorm";

import { createApiDataSourceOptions } from "../src/database/typeorm.config";

async function runMigrations() {
  const dataSource = new DataSource(createApiDataSourceOptions());
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

void runMigrations();
