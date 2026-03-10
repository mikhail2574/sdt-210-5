import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { FormDefinitionEntity } from "./form-definition.entity";
import { TenantEntity } from "./tenant.entity";

@Entity({ name: "form_overrides" })
export class FormOverrideEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "tenant_id", type: "varchar", length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: TenantEntity;

  @Column({ name: "base_form_id", type: "varchar", length: 36 })
  baseFormId!: string;

  @ManyToOne(() => FormDefinitionEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "base_form_id" })
  baseForm!: FormDefinitionEntity;

  @Column({ name: "operations_json", type: "jsonb", default: () => "'[]'" })
  operationsJson!: unknown[];

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;
}
