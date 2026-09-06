"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { toggleFavorite } from "@/app/actions/account";

/**
 * The heart on a product.
 *
 * Optimistic here, unlike the sold-out switch in the staff area — and the
 * difference is deliberate. Getting a favourite wrong for a moment costs
 * nothing; getting availability wrong means customers keep ordering a drink
 * the shop cannot make. Cost of being briefly wrong is what decides whether
 * optimism is appropriate, not how modern it feels.
 *
 * Logged-out visitors get the button too, and a nudge to sign in when they
 * press it. Hiding it would mean the feature is invisible to exactly the
 * people who have not signed up yet.
 */
export function FavoriteButton({
  menuItemId,
  itemName,
  isFavorite,
  isLoggedIn,
  size = "md",
}: {
  menuItemId: string;
  itemName: string;
  isFavorite: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(isFavorite);

  const dimension = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  function onClick() {
    if (!isLoggedIn) {
      toast("Log in to save favourites.");
      router.push("/login?next=/favorites");
      return;
    }

    startTransition(async () => {
      setOptimistic(!optimistic);
      const { error } = await toggleFavorite(menuItemId, optimistic);
      if (error) {
        toast.error(error);
        // No manual rollback needed — useOptimistic reverts to the prop once
        // the transition settles, and the revalidate brings the true value.
        return;
      }
      toast.success(optimistic ? `Removed ${itemName}` : `Saved ${itemName}`);
    });
  }

  const label = optimistic
    ? `Remove ${itemName} from favourites`
    : `Save ${itemName} to favourites`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimistic}
      aria-label={label}
      title={label}
      className={`relative z-10 flex ${dimension} shrink-0 items-center justify-center rounded-full border transition-colors ${
        optimistic
          ? "border-accent bg-accent-soft text-accent-ink"
          : "border-line-strong bg-card text-muted hover:border-ink-soft hover:text-ink"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={icon}
        // Filled when saved, outlined when not — the shape changes, not just
        // the colour, so the state survives a greyscale display.
        fill={optimistic ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path
          d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
