import { Button, ButtonLink } from "@/components/ui/button";
import { buildHref, type MenuFilterState } from "@/components/menu-filters";

export function MenuPagination({ page, pages, state }: {
  page: number;
  pages: number;
  state: MenuFilterState;
}) {
  if (pages <= 1) return null;
  const href = (target: number) => `${buildHref({ ...state, page: target })}#menu-results`;

  return (
    <nav aria-label="Menu pages" className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <ButtonLink href={href(page - 1)} variant="outline" rel="prev">Previous</ButtonLink>
      ) : (
        <Button variant="outline" disabled>Previous</Button>
      )}
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
        <ButtonLink
          key={number}
          href={href(number)}
          variant={number === page ? "primary" : "outline"}
          className="min-h-11 min-w-11 px-3"
          aria-label={`Page ${number}`}
          aria-current={number === page ? "page" : undefined}
        >
          {number}
        </ButtonLink>
      ))}
      {page < pages ? (
        <ButtonLink href={href(page + 1)} variant="outline" rel="next">Next</ButtonLink>
      ) : (
        <Button variant="outline" disabled>Next</Button>
      )}
    </nav>
  );
}
