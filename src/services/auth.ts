import type { CustomerLoginInput, StaffLoginInput } from "@/lib/frontend/api-contract";
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
  signOutStaff() {
    return appApi.staffAuth.logout();
  }
};
