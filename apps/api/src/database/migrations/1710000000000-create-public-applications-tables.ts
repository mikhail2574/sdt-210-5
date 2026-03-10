import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePublicApplicationsTables1710000000000 implements MigrationInterface {
  name = "CreatePublicApplicationsTables1710000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "code" varchar(64) UNIQUE NOT NULL,
        "name" varchar(255) NOT NULL,
        "theme_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "form_definitions" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "tenant_id" varchar(36),
        "key" varchar(128) NOT NULL,
        "title_i18n_key" varchar(255) NOT NULL,
        "schema_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "is_published" boolean NOT NULL DEFAULT false,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_form_definition_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "form_overrides" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "tenant_id" varchar(36) NOT NULL,
        "base_form_id" varchar(36) NOT NULL,
        "operations_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_form_override_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_form_override_base_form" FOREIGN KEY ("base_form_id") REFERENCES "form_definitions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "tenant_id" varchar(36) NOT NULL,
        "form_id" varchar(36) NOT NULL,
        "public_tracking_code" varchar(128),
        "customer_access_password_hash" varchar(255),
        "status" varchar(64) NOT NULL,
        "current_step_key" varchar(128),
        "is_locked_for_customer" boolean NOT NULL DEFAULT false,
        "unread_by_staff" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "submitted_at" timestamptz,
        "last_activity_at" timestamptz NOT NULL,
        "completed_at" timestamptz,
        CONSTRAINT "fk_application_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_application_form" FOREIGN KEY ("form_id") REFERENCES "form_definitions"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "application_page_data" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "application_id" varchar(36) NOT NULL,
        "page_key" varchar(128) NOT NULL,
        "data_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "soft_missing_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "hard_missing_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "updated_at" timestamptz NOT NULL,
        "updated_by_actor_type" varchar(32) NOT NULL,
        "updated_by_user_id" varchar(36),
        CONSTRAINT "fk_application_page_data_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_application_page" UNIQUE ("application_id", "page_key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "application_page_data"`);
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TABLE "form_overrides"`);
    await queryRunner.query(`DROP TABLE "form_definitions"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
