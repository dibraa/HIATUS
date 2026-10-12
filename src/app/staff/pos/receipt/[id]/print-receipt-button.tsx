"use client";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ui-caps rounded-md bg-cta px-3 py-2 text-2xs text-cta-fg transition-colors hover:bg-cta-hover"
    >
      Print receipt
    </button>
  );
}
