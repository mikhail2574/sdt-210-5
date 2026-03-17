import type { SelectHTMLAttributes } from "react";

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectInput({ className, ...props }: SelectInputProps) {
  return <select {...props} className={["field-control", className].filter(Boolean).join(" ")} />;
}
