"use client";

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";

/** Native top-layer popovers escape the roster's horizontal scroll container. */
export function TeamActionMenu({ open, onOpenChange, triggerRef, children, label }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
  label: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!panel || !trigger || !open) return;
    panel.showPopover();

    function position() {
      if (!panel || !trigger) return;
      const anchor = trigger.getBoundingClientRect();
      const bounds = panel.getBoundingClientRect();
      const gap = 8;
      const left = Math.max(gap, Math.min(anchor.right - bounds.width, window.innerWidth - bounds.width - gap));
      const preferredTop = anchor.bottom + gap + bounds.height <= window.innerHeight
        ? anchor.bottom + gap
        : Math.max(gap, anchor.top - bounds.height - gap);
      const top = Math.max(gap, Math.min(preferredTop, window.innerHeight - bounds.height - gap));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }

    position();
    panel.querySelector<HTMLElement>('button:not([disabled]), select:not([disabled])')?.focus();
    const observer = new ResizeObserver(position);
    observer.observe(panel);
    const reposition = (event: Event) => {
      if (!(event.target instanceof Node) || !panel.contains(event.target)) position();
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      if (panel.matches(":popover-open")) panel.hidePopover();
    };
  }, [open, onOpenChange, triggerRef]);

  return (
    <div ref={panelRef} popover="auto" className="admin-team-action-menu" aria-label={label}
      onToggle={(event) => { if (event.newState === "closed") onOpenChange(false); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onOpenChange(false);
          triggerRef.current?.focus();
        }
      }}>
      {children}
    </div>
  );
}
