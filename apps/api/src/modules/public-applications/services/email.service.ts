import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";

import { ApiServiceUnavailableException } from "../errors/api-http.exceptions";
import { getEmailConfig } from "./email-config";

type InvitationEmailInput = {
  email: string;
  expiresAt: Date;
  inviteId: string;
  invitedBy: string;
  role: string;
  tenantName: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  async sendInvitationEmail(input: InvitationEmailInput) {
    const config = getEmailConfig();

    if (!config.deliveryEnabled) {
      this.logger.log(`Email delivery disabled; skipping invitation email for ${input.email}`);
      return;
    }

    if (!config.smtp) {
      throw new ApiServiceUnavailableException(
        "Invitation email is not configured. Set SMTP_USER, SMTP_PASSWORD, SMTP_FROM_NAME, and FRONTEND_APP_URL."
      );
    }

    const invitationUrl = `${config.frontendAppUrl}/${config.invitationLocale}/invitations/${input.inviteId}`;
    const transporter = this.getTransporter(config.smtp);
    const subject = `${input.tenantName}: Einladung zum Backoffice`;
    const text = [
      `Hallo,`,
      "",
      `${input.invitedBy} hat dich als ${input.role} in den Workspace "${input.tenantName}" eingeladen.`,
      "",
      `Akzeptiere die Einladung hier: ${invitationUrl}`,
      `Die Einladung ist gueltig bis ${formatDateTime(input.expiresAt)}.`,
      "",
      "Falls du diese Einladung nicht erwartet hast, ignoriere diese E-Mail."
    ].join("\n");
    const html = `
      <div style="font-family:Arial,sans-serif;color:#10213a;line-height:1.6">
        <p>Hallo,</p>
        <p><strong>${escapeHtml(input.invitedBy)}</strong> hat dich als <strong>${escapeHtml(input.role)}</strong> in den Workspace <strong>${escapeHtml(input.tenantName)}</strong> eingeladen.</p>
        <p>
          <a href="${escapeHtml(invitationUrl)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0057B8;color:#ffffff;text-decoration:none;font-weight:700">
            Einladung annehmen
          </a>
        </p>
        <p>Oder direkt diesen Link oeffnen:<br /><a href="${escapeHtml(invitationUrl)}">${escapeHtml(invitationUrl)}</a></p>
        <p>Die Einladung ist gueltig bis ${escapeHtml(formatDateTime(input.expiresAt))}.</p>
        <p>Falls du diese Einladung nicht erwartet hast, ignoriere diese E-Mail.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        html,
        subject,
        text,
        to: input.email
      });
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${input.email}`, error instanceof Error ? error.stack : undefined);
      throw new ApiServiceUnavailableException(
        "Invitation email could not be sent. Check the SMTP settings and Gmail app password."
      );
    }
  }

  private getTransporter(config: NonNullable<ReturnType<typeof getEmailConfig>["smtp"]>) {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        auth: {
          pass: config.password,
          user: config.user
        },
        host: config.host,
        port: config.port,
        secure: config.secure
      });
    }

    return this.transporter;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Berlin",
    year: "numeric"
  }).format(value);
}
