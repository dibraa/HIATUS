"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { savePreset } from "@/app/actions/account";
import type { CartLine } from "@/lib/cart-context";

/**
 * Saves the current cart as a reusable preset.
 *
 * Collapsed to a single link until pressed. The cart's job is to get someone to
 * checkout, and a naming form permanently expanded above the total is a second
 * call to action competing with the one that matters.
 *
 * Only offered to signed-in customers — a preset has nowhere to live otherwise,
 * and prompting for a name before revealing that would waste the effort.
 */
export function SavePreset({
  lines,
  isLoggedIn,
}: {
  lines: CartLine[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  if (!isLoggedIn || lines.length === 0) return null;

  if (!mounted) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink"
      >
        Save this as your usual
      </button>
    );
  }

  return (
    <form
      className={`flex flex-col gap-2 transition-[opacity,transform] duration-(--hi-dur-base) ease-hi-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const { error } = await savePreset(
            name,
            lines.map((l) => ({
              menu_item_id: l.menuItemId,
              quantity: l.quantity,
              size: l.size,
            }))
          );

          if (error) {
            toast.error(error);
            return;
          }

          toast.success(`Saved as “${name.trim()}”`);
          setName("");
          setOpen(false);
        });
      }}
    >
      <label htmlFor="preset-name" className="text-xs font-medium text-ink-soft">
        Name this order
      </label>

      <div className="flex flex-wrap gap-2">
        <input
          id="preset-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          autoFocus
          placeholder="Morning flat white"
          className="min-w-0 flex-1 rounded-md border border-line-strong bg-card px-3 py-2 text-sm text-ink placeholder:text-muted"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>

      <p className="text-2xs text-muted">
        Prices are not saved — a preset is always re-priced at today&rsquo;s menu.
      </p>
    </form>
  );
}
