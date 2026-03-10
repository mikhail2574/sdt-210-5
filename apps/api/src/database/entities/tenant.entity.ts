import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "tenants" })
export class TenantEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 64, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ name: "theme_json", type: "jsonb", default: () => "'{}'" })
  themeJson!: Record<string, unknown>;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;
}
