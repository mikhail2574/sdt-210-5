import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ApplicationEntity } from "./application.entity";

@Entity({ name: "application_audit_logs" })
export class ApplicationAuditLogEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "application_id", type: "varchar", length: 36 })
  applicationId!: string;

  @ManyToOne(() => ApplicationEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "application_id" })
  application!: ApplicationEntity;

  @Column({ name: "changed_at", type: "timestamp with time zone" })
  changedAt!: Date;

  @Column({ name: "changed_by_user_id", type: "varchar", length: 36, nullable: true })
  changedByUserId!: string | null;

  @Column({ name: "changed_by_actor_type", type: "varchar", length: 32 })
  changedByActorType!: string;

  @Column({ name: "page_key", type: "varchar", length: 128 })
  pageKey!: string;

  @Column({ name: "field_path", type: "varchar", length: 255 })
  fieldPath!: string;

  @Column({ name: "old_value_json", type: "jsonb", default: () => "'null'" })
  oldValueJson!: unknown;

  @Column({ name: "new_value_json", type: "jsonb", default: () => "'null'" })
  newValueJson!: unknown;

  @Column({ type: "text", nullable: true })
  reason!: string | null;
}
