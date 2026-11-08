import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/** Segmented tabs: pills on the subtle track, the active one lifted onto white. */
const segTrack = "inline-flex items-center gap-0.5 rounded-full bg-surface-2 p-[3px]";
const segItem =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-3.5 text-caption font-medium text-text/60 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50";
const segActive = "border-line bg-surface text-text shadow-soft";

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  ({ className, ...props }, ref) => <TabsPrimitive.List ref={ref} className={cn(segTrack, className)} {...props} />,
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(segItem, "data-[state=active]:border-line data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-soft", className)}
      {...props}
    />
  ),
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  ({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={cn("focus-visible:outline-none", className)} {...props} />,
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

/** Same look as TabsList for plain button groups (role, language, decision type…). */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  itemClassName,
  disabled,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; title?: string }[];
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" className={cn(segTrack, className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(segItem, size === "sm" && "h-7 px-2.5 text-[12px]", value === o.value && segActive, itemClassName)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, Segmented };
