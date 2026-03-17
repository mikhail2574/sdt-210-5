import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={[variant === "primary" ? "wizard-button" : "wizard-button-secondary", className].filter(Boolean).join(" ")}
    />
  );
}
