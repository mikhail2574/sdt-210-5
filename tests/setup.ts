import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";

import { resetAppStore } from "@/lib/state/app-store";

beforeEach(() => {
  resetAppStore();
});

afterEach(() => {
  localStorage.clear();
  resetAppStore();
});
