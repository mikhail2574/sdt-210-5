import type { AcceptInvitationInput, CustomerLoginInput, StaffLoginInput } from "@/lib/frontend/api-contract";
import { appApi } from "@/services/api";

export const authService = {
  signInCustomer(input: CustomerLoginInput) {
    return appApi.customerAuth.login(input);
  },
  signOutCustomer() {
    return appApi.customerAuth.logout();
  },
  signInStaff(input: StaffLoginInput) {
    return appApi.staffAuth.login(input);
  },
  acceptInvitation(inviteId: string, input: AcceptInvitationInput) {
    return appApi.staffAuth.acceptInvitation(inviteId, input);
  },
  signOutStaff() {
    return appApi.staffAuth.logout();
  }
};
