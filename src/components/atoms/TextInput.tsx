import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return <input {...props} className={["field-control", className].filter(Boolean).join(" ")} />;
}
