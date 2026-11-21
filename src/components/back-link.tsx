import { ButtonLink } from "@/components/ui/button";

/**
 * The page-level "Back" button. A real link to a fixed parent rather than
 * history.back(): it lands in the same place whether the page was reached by
 * a click, a shared URL or a refresh, and the browser's own back still works.
 */
export function BackLink({ href }: { href: string }) {
  return (
    <nav aria-label="Back">
      <ButtonLink href={href} variant="outline" size="md">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
          <path d="m11.5 4.5-5.5 5.5 5.5 5.5M6 10h11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </ButtonLink>
    </nav>
  );
}
