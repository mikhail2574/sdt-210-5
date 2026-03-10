import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";

import { FormDefinitionEntity } from "./form-definition.entity";
import { ApplicationPageDataEntity } from "./application-page-data.entity";
import { TenantEntity } from "./tenant.entity";

@Entity({ name: "applications" })
export class ApplicationEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "tenant_id", type: "varchar", length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: TenantEntity;

  @Column({ name: "form_id", type: "varchar", length: 36 })
  formId!: string;

  @ManyToOne(() => FormDefinitionEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "form_id" })
  form!: FormDefinitionEntity;

  @Column({ name: "public_tracking_code", type: "varchar", length: 128, nullable: true })
  publicTrackingCode!: string | null;

  @Column({ name: "customer_access_password_hash", type: "varchar", length: 255, nullable: true })
  customerAccessPasswordHash!: string | null;

  @Column({ type: "varchar", length: 64 })
  status!: string;

  @Column({ name: "current_step_key", type: "varchar", length: 128, nullable: true })
  currentStepKey!: string | null;

  @Column({ name: "is_locked_for_customer", type: "boolean", default: false })
  isLockedForCustomer!: boolean;

  @Column({ name: "unread_by_staff", type: "boolean", default: true })
  unreadByStaff!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  @Column({ name: "submitted_at", type: "timestamp with time zone", nullable: true })
  submittedAt!: Date | null;

  @Column({ name: "last_activity_at", type: "timestamp with time zone" })
  lastActivityAt!: Date;

  @Column({ name: "completed_at", type: "timestamp with time zone", nullable: true })
  completedAt!: Date | null;

  @OneToMany(() => ApplicationPageDataEntity, (pageData) => pageData.application)
  pageData!: ApplicationPageDataEntity[];
}
