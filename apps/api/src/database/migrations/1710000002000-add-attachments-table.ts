import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttachmentsTable1710000002000 implements MigrationInterface {
  name = "AddAttachmentsTable1710000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "tenant_id" varchar(36) NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
        "application_id" varchar(36) NOT NULL REFERENCES "applications" ("id") ON DELETE CASCADE,
        "category_key" varchar(64) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "mime_type" varchar(255) NOT NULL,
        "size_bytes" integer NOT NULL,
        "storage_key" varchar(512) NOT NULL,
        "status" varchar(32) NOT NULL,
        "uploaded_at" timestamptz NOT NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_attachments_application" ON "attachments" ("application_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_attachments_application"`);
    await queryRunner.query(`DROP TABLE "attachments"`);
  }
}
