"use client";

import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { cashError, quickCash } from "@/lib/cash";
import { formatPrice } from "@/lib/format";

/** Opening one ticket's keypad closes any other, so typed digits have one home. */
const OPEN_EVENT = "counter-keypad-open";

/** One press records the cash: Exact, the next notes above the total, or Other. */
export function CashButtons({
  total,
  disabled,
  onPick,
  onOther,
}: {
  total: number;
  disabled?: boolean;
  onPick: (cash: number) => void;
  onOther: () => void;
}) {
  const amounts = quickCash(total);
  return (
    <div className="counter-cash" role="group" aria-label="Cash received">
      {amounts.map((amount, i) => (
        <Button
          key={amount}
          variant={i === 0 ? "primary" : "outline"}
          className="counter-cash-key"
          disabled={disabled}
          onClick={() => onPick(amount)}
        >
          {i === 0 ? "Exact" : formatPrice(amount).replace(".00", "")}
        </Button>
      ))}
      <Button
        variant="outline"
        className="counter-cash-key"
        disabled={disabled}
        onClick={onOther}
      >
        Other
      </Button>
    </div>
  );
}

/** Digits typed so far, kept to whole pesos and six figures. */
function press(value: string, key: string) {
  if (key === "back") return value.slice(0, -1);
  const next = (value + key).replace(/^0+/, "");
  return next.length > 6 ? value : next;
}

/**
 * On-screen keys for an odd amount (₱360 for ₱350). The keyboard's number row
 * and numpad type into it too (numpad by physical key, so NumLock doesn't
 * matter), Backspace deletes, Enter records, Escape goes back. The amount and
 * the change sit in the ticket's footer (CashKeypadActions) so the keys fit.
 */
export function CashKeypad({
  total,
  value,
  onChange,
  onSubmit,
  onClose,
}: {
  total: number;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (cash: number) => void;
  onClose: () => void;
}) {
  const id = useId();
  const cash = Number(value || 0);
  const error = cashError(cash, total);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    const closeIfOther = (event: Event) => {
      if ((event as CustomEvent).detail !== id) onClose();
    };
    window.addEventListener(OPEN_EVENT, closeIfOther);
    return () => window.removeEventListener(OPEN_EVENT, closeIfOther);
  }, [id, onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      // Typing in the search box or a dialog field stays there.
      if (event.ctrlKey || event.metaKey || event.altKey || target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog']")) return;
      // Enter on a focused Back or Paid button does that button's job.
      if (event.key === "Enter" && target?.closest("button") && !target.closest(".counter-keypad-keys")) return;
      const digit = /^Numpad([0-9])$/.exec(event.code)?.[1] ?? (/^[0-9]$/.test(event.key) ? event.key : null);
      if (digit) onChange(press(value, digit));
      else if (event.key === "Backspace") onChange(press(value, "back"));
      else if (event.key === "Enter" && !error) onSubmit(cash);
      else if (event.key === "Escape") onClose();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [value, error, cash, onChange, onSubmit, onClose]);

  return (
    <div className="counter-keypad-keys" role="group" aria-label="Keypad">
      {["1", "2", "3", "back", "4", "5", "6", "00", "7", "8", "9", "0"].map((key) => (
        <button
          key={key}
          type="button"
          aria-label={key === "back" ? "Delete last digit" : undefined}
          onClick={() => onChange(press(value, key))}
        >
          {key === "back" ? "⌫" : key}
        </button>
      ))}
    </div>
  );
}

/**
 * Takes the place of the order total while the keypad is open: the cash typed,
 * what is owed, and Back / Paid. Paid names the change (or the shortfall), so
 * the barista reads it off the button they are about to press.
 */
export function CashKeypadActions({
  total,
  value,
  onSubmit,
  onClose,
}: {
  total: number;
  value: string;
  onSubmit: (cash: number) => void;
  onClose: () => void;
}) {
  const cash = Number(value || 0);
  const error = cashError(cash, total);
  const status = !value ? "Type the cash received" : error ?? `Change ${formatPrice(cash - total)}`;
  return (
    <>
      <div className="counter-ticket-total">
        <span>Cash received · owes {formatPrice(total)}</span>
        <strong className="numeric">{formatPrice(cash).replace(".00", "")}</strong>
      </div>
      <p className="sr-only" aria-live="polite">{status}</p>
      <div className="counter-cash is-keypad">
        <Button variant="outline" className="counter-cash-key" onClick={onClose}>
          Back
        </Button>
        <Button className="counter-cash-key" disabled={error !== null} onClick={() => onSubmit(cash)}>
          {!value ? "Paid" : error ? (cash < total ? `Short ${formatPrice(total - cash)}` : "Check amount") : `Paid · change ${formatPrice(cash - total)}`}
        </Button>
      </div>
    </>
  );
}
