import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getServerStaffUser as getBackendStaffUser } from "@/lib/backend/server-data";
import { customerSessionCookieName, staffSessionCookieName } from "@/lib/demo/session";
import type { Locale } from "@/lib/i18n";

export async function getServerStaffUser() {
  const cookieStore = await cookies();

  if (!cookieStore.get(staffSessionCookieName)?.value) {
    return null;
  }

  return getBackendStaffUser();
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
