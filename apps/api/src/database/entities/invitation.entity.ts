import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { TenantEntity } from "./tenant.entity";

@Entity({ name: "invitations" })
export class InvitationEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "tenant_id", type: "varchar", length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: TenantEntity;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ name: "role_key", type: "varchar", length: 64 })
  roleKey!: string;

  @Column({ name: "token_hash", type: "varchar", length: 255 })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamp with time zone" })
  expiresAt!: Date;

  @Column({ type: "varchar", length: 32 })
  status!: string;

  @Column({ name: "accepted_at", type: "timestamp with time zone", nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;
}
