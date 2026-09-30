"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { StarRating } from "@/components/star-rating";

type Review = {
  rating: number;
  comment: string | null;
  reviewerName: string;
  dateLabel: string;
  createdAt: string;
  attachmentUrl: string | null;
  attachmentType: "image" | "video" | null;
};

export function ReviewCard({ review }: { review: Review }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <li>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full rounded-lg border border-line bg-card p-4 text-left transition-colors hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-label={`Read review by ${review.reviewerName}`}
        >
          <span className="flex flex-wrap items-center justify-between gap-2">
            <StarRating value={review.rating} readOnly size="sm" />
            <time dateTime={review.createdAt} className="text-xs text-muted">{review.dateLabel}</time>
          </span>
          <span className="mt-2 block eyebrow text-muted">Verified purchase</span>
        </button>
      </li>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-muted">Review by</p>
                <h3 id="review-dialog-title" className="mt-1 text-xl font-semibold text-ink">{review.reviewerName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close review"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xl text-muted hover:bg-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <StarRating value={review.rating} readOnly size="md" />
              <time dateTime={review.createdAt} className="text-xs text-muted">{review.dateLabel}</time>
            </div>
            <p className="mt-5 border-t border-line pt-5 text-sm leading-6 text-ink-soft">
              {review.comment?.trim() || "This customer left a rating without a comment."}
            </p>
            {review.attachmentUrl && review.attachmentType === "image" && (
              <Image
                src={review.attachmentUrl}
                alt={`Attachment from ${review.reviewerName}`}
                width={640}
                height={480}
                unoptimized
                className="mt-5 max-h-72 w-full rounded-lg object-contain"
              />
            )}
            {review.attachmentUrl && review.attachmentType === "video" && (
              <video src={review.attachmentUrl} controls className="mt-5 max-h-72 w-full rounded-lg" />
            )}
          </section>
        </div>
      )}
    </>
  );
}