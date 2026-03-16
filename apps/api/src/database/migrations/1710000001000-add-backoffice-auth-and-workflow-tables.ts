import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBackofficeAuthAndWorkflowTables1710000001000 implements MigrationInterface {
  name = "AddBackofficeAuthAndWorkflowTables1710000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "applications"
      ADD COLUMN "timeline_json" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "email" varchar(255) UNIQUE NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "display_name" varchar(255) NOT NULL,
        "is_platform_admin" boolean NOT NULL DEFAULT false,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tenant_users" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "tenant_id" varchar(36) NOT NULL,
        "user_id" varchar(36) NOT NULL,
        "role_key" varchar(64) NOT NULL,
        "permissions_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "fk_tenant_user_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_tenant_user_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_tenant_user_membership" UNIQUE ("tenant_id", "user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "tenant_id" varchar(36) NOT NULL,
        "email" varchar(255) NOT NULL,
        "role_key" varchar(64) NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "status" varchar(32) NOT NULL,
        "accepted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_invitation_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "application_audit_logs" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "application_id" varchar(36) NOT NULL,
        "changed_at" timestamptz NOT NULL,
        "changed_by_user_id" varchar(36),
        "changed_by_actor_type" varchar(32) NOT NULL,
        "page_key" varchar(128) NOT NULL,
        "field_path" varchar(255) NOT NULL,
        "old_value_json" jsonb NOT NULL DEFAULT 'null'::jsonb,
        "new_value_json" jsonb NOT NULL DEFAULT 'null'::jsonb,
        "reason" text,
        CONSTRAINT "fk_application_audit_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "application_id" varchar(36) NOT NULL,
        "scheduled_at" timestamptz NOT NULL,
        "timezone" varchar(64) NOT NULL DEFAULT 'Europe/Berlin',
        "scheduled_by_user_id" varchar(36),
        "notes" text NOT NULL DEFAULT '',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_appointment_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TABLE "application_audit_logs"`);
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TABLE "tenant_users"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "timeline_json"`);
  }
}
