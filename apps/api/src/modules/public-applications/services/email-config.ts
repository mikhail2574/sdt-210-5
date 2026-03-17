export type EmailConfig = {
  deliveryEnabled: boolean;
  frontendAppUrl: string;
  invitationLocale: string;
  smtp: {
    fromEmail: string;
    fromName: string;
    host: string;
    password: string;
    port: number;
    secure: boolean;
    user: string;
  } | null;
};

function getBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function getFrontendAppUrl() {
  return (process.env.FRONTEND_APP_URL ?? process.env.WEB_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
}

export function getEmailConfig(): EmailConfig {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPassword = process.env.SMTP_PASSWORD?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? 465);
  const smtpSecure = getBooleanEnv("SMTP_SECURE", smtpPort === 465);
  const mailDisabled = getBooleanEnv("API_DISABLE_EMAIL_DELIVERY", false);
  const runningTests = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
  const smtpConfigured = Boolean(smtpUser && smtpPassword);

  return {
    deliveryEnabled: !mailDisabled && !runningTests,
    frontendAppUrl: getFrontendAppUrl(),
    invitationLocale: process.env.INVITATION_LOCALE?.trim() || "de",
    smtp: smtpConfigured
      ? {
          fromEmail: process.env.SMTP_FROM_EMAIL?.trim() || smtpUser!,
          fromName: process.env.SMTP_FROM_NAME?.trim() || "Stadtwerke Portal",
          host: smtpHost,
          password: smtpPassword!,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser!
        }
      : null
  };
}
