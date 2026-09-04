"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { deletePromotion, setPromotionActive } from "@/app/actions/promotions";

/**
 * Switch a promo on or off, or delete it.
 *
 * Deleting asks for confirmation inline rather than through `window.confirm`:
 * a native dialog is unstyleable, reads as a browser warning rather than part
 * of the app, and on mobile it is a modal interrupt for what is a two-tap
 * decision. The inline version also gets to say what is actually lost.
 */
export function PromoActions({
  id,
  code,
  isActive,
  redemptions,
}: {
  id: string;
  code: string;
  isActive: boolean;
  redemptions: number;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else toast.success(success);
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-right text-xs text-danger">
          {redemptions > 0
            ? `Deleting ${code} also removes its ${redemptions} redemption ${
                redemptions === 1 ? "record" : "records"
              } from the reports.`
            : `Delete ${code} permanently?`}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setConfirming(false)}
          >
            Keep it
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => run(() => deletePromotion(id), `${code} deleted`)}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={isActive ? "outline" : "secondary"}
        disabled={pending}
        onClick={() =>
          run(
            () => setPromotionActive(id, !isActive),
            isActive ? `${code} switched off` : `${code} is live`
          )
        }
      >
        {isActive ? "Switch off" : "Switch on"}
      </Button>

      {/* Retiring is almost always the right move over deleting, so delete is
          the quieter of the two. */}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => setConfirming(true)}
      >
        Delete
      </Button>
    </div>
  );
}
