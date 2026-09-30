"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { StarRating } from "@/components/star-rating";
import { TextAreaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { submitRating } from "@/app/actions/orders";

export function RatingForm({
  orderId,
  menuItemId,
  itemName,
}: {
  orderId: string;
  menuItemId: string;
  itemName: string;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  // The card is replaced in place rather than disappearing, so the person who
  // just pressed the button still has something to read where it used to be.
  if (submitted) {
    return (
      <p
        aria-live="polite"
        className="rounded-lg border border-success/40 bg-success-soft-bg px-4 py-3 text-sm font-medium text-success-soft-fg"
      >
        Thanks for rating {itemName}.
      </p>
    );
  }

  // Namespaced so several of these can render on one page without colliding.
  const commentId = `rating-comment-${menuItemId}`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4">
      <p className="text-sm font-medium text-ink">Rate {itemName}</p>

      {/* StarRating renders a real radio group; its `label` becomes the
          fieldset legend, which is what a screen reader announces on entry. */}
      <StarRating value={rating} onChange={setRating} label={`Your rating for ${itemName}`} />

      <TextAreaField
        id={commentId}
        label="Comment (optional)"
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What did you think?"
      />

      <div>
        <label htmlFor={`${commentId}-attachment`} className="ui-caps text-2xs text-ink-soft">Add a photo or video (optional)</label>
        <input
          id={`${commentId}-attachment`}
          type="file"
          accept="image/*,video/*"
          className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-card file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink hover:file:border-ink"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (file && file.size > 10 * 1024 * 1024) {
              setAttachment(null);
              setAttachmentError("Choose a file smaller than 10 MB.");
              event.target.value = "";
              return;
            }
            setAttachment(file);
            setAttachmentError(null);
          }}
        />
        {attachment && <p className="mt-1 text-xs text-muted">{attachment.name}</p>}
        {attachmentError && <p className="mt-1 text-xs text-danger-fg">{attachmentError}</p>}
      </div>

      <Button
        size="sm"
        className="self-start"
        disabled={rating === 0 || pending}
        onClick={() =>
          startTransition(async () => {
            const result = await submitRating(orderId, menuItemId, rating, comment, attachment);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            setSubmitted(true);
          })
        }
      >
        {pending ? "Submitting…" : "Submit rating"}
      </Button>

      {/* Says why the button is dead instead of leaving it inexplicably grey. */}
      {rating === 0 && (
        <p className="text-xs text-muted">Pick a star rating to submit.</p>
      )}
    </div>
  );
}
