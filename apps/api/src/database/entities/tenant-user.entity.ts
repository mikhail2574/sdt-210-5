import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from "typeorm";

import { TenantEntity } from "./tenant.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "tenant_users" })
@Unique("uq_tenant_user_membership", ["tenantId", "userId"])
export class TenantUserEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "tenant_id", type: "varchar", length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: TenantEntity;

  @Column({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @Column({ name: "role_key", type: "varchar", length: 64 })
  roleKey!: string;

  @Column({ name: "permissions_json", type: "jsonb", default: () => "'{}'" })
  permissionsJson!: Record<string, unknown>;
}
