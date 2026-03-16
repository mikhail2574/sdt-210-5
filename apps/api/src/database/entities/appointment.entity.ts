import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ApplicationEntity } from "./application.entity";

@Entity({ name: "appointments" })
export class AppointmentEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "application_id", type: "varchar", length: 36 })
  applicationId!: string;

  @ManyToOne(() => ApplicationEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "application_id" })
  application!: ApplicationEntity;

  @Column({ name: "scheduled_at", type: "timestamp with time zone" })
  scheduledAt!: Date;

  @Column({ type: "varchar", length: 64, default: "Europe/Berlin" })
  timezone!: string;

  @Column({ name: "scheduled_by_user_id", type: "varchar", length: 36, nullable: true })
  scheduledByUserId!: string | null;

  @Column({ type: "text", default: "" })
  notes!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;
}
