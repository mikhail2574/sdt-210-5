import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { TenantEntity } from "./tenant.entity";

@Entity({ name: "form_definitions" })
export class FormDefinitionEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "tenant_id", type: "varchar", length: 36, nullable: true })
  tenantId!: string | null;

  @ManyToOne(() => TenantEntity, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant?: TenantEntity | null;

  @Column({ type: "varchar", length: 128 })
  key!: string;

  @Column({ name: "title_i18n_key", type: "varchar", length: 255 })
  titleI18nKey!: string;

  @Column({ name: "schema_json", type: "jsonb", default: () => "'{}'" })
  schemaJson!: Record<string, unknown>;

  @Column({ name: "is_published", type: "boolean", default: false })
  isPublished!: boolean;

  @Column({ type: "integer", default: 1 })
  version!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;
}
