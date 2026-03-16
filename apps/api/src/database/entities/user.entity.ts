import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ name: "display_name", type: "varchar", length: 255 })
  displayName!: string;

  @Column({ name: "is_platform_admin", type: "boolean", default: false })
  isPlatformAdmin!: boolean;

  @Column({ name: "last_login_at", type: "timestamp with time zone", nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;
}
