import { notFound } from "next/navigation";

import { AcceptInvitationForm } from "@/components/backoffice/AcceptInvitationForm";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

type InvitationAcceptPageProps = {
  params: Promise<{
    inviteId: string;
    locale: string;
  }>;
};

export default async function InvitationAcceptPage({ params }: InvitationAcceptPageProps) {
  const { inviteId, locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);

  return (
    <main className="home-shell">
      <section className="home-card">
        <h1>{messages.invitationAccept.title}</h1>
        <p>{messages.invitationAccept.description}</p>
        <AcceptInvitationForm inviteId={inviteId} locale={locale as Locale} />
      </section>
    </main>
  );
}
