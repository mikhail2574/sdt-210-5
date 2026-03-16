import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ApplicationEntity } from "./application.entity";
import { TenantEntity } from "./tenant.entity";

@Entity({ name: "attachments" })
export class AttachmentEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "tenant_id", type: "varchar", length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: TenantEntity;

  @Column({ name: "application_id", type: "varchar", length: 36 })
  applicationId!: string;

  @ManyToOne(() => ApplicationEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "application_id" })
  application!: ApplicationEntity;

  @Column({ name: "category_key", type: "varchar", length: 64 })
  categoryKey!: string;

  @Column({ name: "file_name", type: "varchar", length: 255 })
  fileName!: string;

  @Column({ name: "mime_type", type: "varchar", length: 255 })
  mimeType!: string;

  @Column({ name: "size_bytes", type: "integer" })
  sizeBytes!: number;

  @Column({ name: "storage_key", type: "varchar", length: 512 })
  storageKey!: string;

  @Column({ type: "varchar", length: 32 })
  status!: string;

  @Column({ name: "uploaded_at", type: "timestamp with time zone" })
  uploadedAt!: Date;
}
