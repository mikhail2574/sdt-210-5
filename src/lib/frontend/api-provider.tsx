"use client";

import { createContext, useContext, type ReactNode } from "react";

import { createBrowserFrontendApi } from "@/lib/frontend/api-client";
import type { FrontendApi } from "@/lib/frontend/api-contract";

const defaultFrontendApi = createBrowserFrontendApi();

const FrontendApiContext = createContext<FrontendApi>(defaultFrontendApi);

type FrontendApiProviderProps = {
  children: ReactNode;
  value?: FrontendApi;
};

export function FrontendApiProvider({ children, value }: FrontendApiProviderProps) {
  return <FrontendApiContext.Provider value={value ?? defaultFrontendApi}>{children}</FrontendApiContext.Provider>;
}

export function useFrontendApi() {
  return useContext(FrontendApiContext);
}
