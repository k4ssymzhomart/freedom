import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const field =
  "w-full border border-transparent bg-surface-2 text-caption text-text placeholder:text-text-2 transition-colors hover:border-line focus-visible:border-line-strong/70 focus-visible:bg-surface focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

/** Pill field on the subtle fill; turns white with an ink edge on focus. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(field, "flex h-10 rounded-full px-4 file:border-0 file:bg-transparent file:text-caption file:font-medium", className)}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea className={cn(field, "flex min-h-[80px] rounded-md px-4 py-3 leading-[1.5]", className)} ref={ref} {...props} />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
