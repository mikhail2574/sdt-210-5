import type { ReactNode } from "react";

type FormMessageProps = {
  children: ReactNode;
  tone?: "default" | "success" | "warning";
};

export function FormMessage({ children, tone = "default" }: FormMessageProps) {
  return (
    <p
      className={[
        "field-message",
        tone === "warning" ? "warning" : "",
        tone === "success" ? "success" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}
