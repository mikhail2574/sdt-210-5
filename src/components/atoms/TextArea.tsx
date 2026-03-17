import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps) {
  return <textarea {...props} className={["field-control-textarea", className].filter(Boolean).join(" ")} />;
}
