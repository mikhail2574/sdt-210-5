import "reflect-metadata";

import { Client } from "pg";
import { DataSource } from "typeorm";

import { createApiDataSourceOptions } from "../src/database/typeorm.config";

type PostgresConnectionOptions = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

function getPostgresConnectionOptions(): PostgresConnectionOptions {
  const options = createApiDataSourceOptions() as {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
  };

  return {
    host: options.host ?? "127.0.0.1",
    port: options.port ?? 5432,
    username: options.username ?? "postgres",
    password: options.password ?? "postgres",
    database: options.database ?? "sdt_210_5"
  };
}

function escapeIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

async function connectMaintenanceClient(connection: PostgresConnectionOptions) {
  const candidates = [process.env.API_DB_MAINTENANCE_DB, "postgres", "template1"]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, allValues) => allValues.indexOf(value) === index);

  let lastError: unknown = null;

  for (const candidate of candidates) {
    const client = new Client({
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password: connection.password,
      database: candidate
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
    }
  }

  throw lastError;
}

async function ensureDatabaseExists() {
  const connection = getPostgresConnectionOptions();
  const client = await connectMaintenanceClient(connection);

  try {
    const result = await client.query("select 1 from pg_database where datname = $1", [connection.database]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${escapeIdentifier(connection.database)}`);
    }
  } finally {
    await client.end();
  }
}

async function runMigrations() {
  await ensureDatabaseExists();

  const dataSource = new DataSource(createApiDataSourceOptions());
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

void runMigrations();
