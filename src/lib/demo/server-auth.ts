import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDemoProfile } from "@/lib/demo/demo-store";
import { customerSessionCookieName, staffSessionCookieName } from "@/lib/demo/session";
import type { Locale } from "@/lib/i18n";

export async function getServerStaffUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(staffSessionCookieName)?.value ?? "";
  return getDemoProfile(token);
}

export async function requireServerStaffUser(locale: Locale) {
  const user = await getServerStaffUser();

  if (!user) {
    redirect(`/${locale}/backoffice/login`);
  }

  return user;
}

export async function getServerCustomerApplicationId() {
  const cookieStore = await cookies();
  return cookieStore.get(customerSessionCookieName)?.value ?? null;
}

export async function requireServerCustomerApplicationId(locale: Locale, applicationId: string) {
  const sessionApplicationId = await getServerCustomerApplicationId();

  if (!sessionApplicationId || sessionApplicationId !== applicationId) {
    redirect(`/${locale}/login`);
  }

  return sessionApplicationId;
}
