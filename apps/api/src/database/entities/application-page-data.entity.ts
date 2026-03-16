import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from "typeorm";

import { ApplicationEntity } from "./application.entity";

@Entity({ name: "application_page_data" })
@Unique("uq_application_page", ["applicationId", "pageKey"])
export class ApplicationPageDataEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "application_id", type: "varchar", length: 36 })
  applicationId!: string;

  @ManyToOne(() => ApplicationEntity, (application) => application.pageData, { onDelete: "CASCADE" })
  @JoinColumn({ name: "application_id" })
  application!: ApplicationEntity;

  @Column({ name: "page_key", type: "varchar", length: 128 })
  pageKey!: string;

  @Column({ name: "data_json", type: "jsonb", default: () => "'{}'" })
  dataJson!: Record<string, unknown>;

  @Column({ name: "soft_missing_json", type: "jsonb", default: () => "'[]'" })
  softMissingJson!: string[];

  @Column({ name: "hard_missing_json", type: "jsonb", default: () => "'[]'" })
  hardMissingJson!: Array<Record<string, unknown>>;

  @Column({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt!: Date;

  @Column({ name: "updated_by_actor_type", type: "varchar", length: 32 })
  updatedByActorType!: string;

  @Column({ name: "updated_by_user_id", type: "varchar", length: 36, nullable: true })
  updatedByUserId!: string | null;
}
