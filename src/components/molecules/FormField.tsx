import type { ReactNode } from "react";

import { FormMessage } from "@/components/atoms/FormMessage";

type FormFieldProps = {
  children: ReactNode;
  htmlFor: string;
  label: ReactNode;
  message?: ReactNode;
  messageTone?: "default" | "warning";
};

export function FormField({ children, htmlFor, label, message, messageTone = "default" }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {message ? <FormMessage tone={messageTone}>{message}</FormMessage> : null}
    </div>
  );
}
