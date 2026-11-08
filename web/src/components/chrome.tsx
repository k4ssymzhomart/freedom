import * as React from "react";
import { createPortal } from "react-dom";

/**
 * The app shell owns the top bar; pages put their title there through this slot
 * (breadcrumb + title on the left, like the kit's top bar). In embed mode there is no
 * shell, so `PageTitle` returns null and callers render the title inline instead.
 */
const SlotContext = React.createContext<HTMLElement | null>(null);

export function TitleSlotProvider({ slot, children }: { slot: HTMLElement | null; children: React.ReactNode }) {
  return <SlotContext.Provider value={slot}>{children}</SlotContext.Provider>;
}

export function useTitleSlot(): HTMLElement | null {
  return React.useContext(SlotContext);
}

export function PageTitle({ crumb, title, after }: { crumb?: React.ReactNode; title: React.ReactNode; after?: React.ReactNode }) {
  const slot = useTitleSlot();
  if (!slot) return null;
  return createPortal(
    <div className="flex min-w-0 flex-col gap-0.5">
      {crumb ? <div className="truncate text-small text-text-2">{crumb}</div> : null}
      <div className="flex min-w-0 items-center gap-2.5">
        <h1 className="truncate font-display text-h2">{title}</h1>
        {after}
      </div>
    </div>,
    slot,
  );
}
