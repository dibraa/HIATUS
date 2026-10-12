import Link from "next/link";

/**
 * "Browse": the menu's categories as four bold blocks, each opening the menu
 * on that category. The block colours are the brand's four grounds (espresso,
 * pine, tan, orange tint) in a fixed order, each with its own text tokens so
 * every pairing keeps its measured contrast.
 */
const BLOCK_TONES = [
  { bg: "bg-inverse-card", title: "text-inverse-card-fg", meta: "text-inverse-card-muted" },
  { bg: "bg-inverse-bg", title: "text-inverse-fg", meta: "text-inverse-muted" },
  { bg: "bg-band", title: "text-band-fg", meta: "text-band-muted" },
  { bg: "bg-accent-soft", title: "text-ink", meta: "text-accent-ink" },
];

export function CategoryBlocks({ categories }: { categories: { name: string; count: number }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {categories.slice(0, 4).map((category, i) => {
        const tone = BLOCK_TONES[i % BLOCK_TONES.length];
        return (
          <li key={category.name}>
            <Link
              href={`/menu?category=${encodeURIComponent(category.name)}`}
              className={`flex min-h-28 flex-col justify-between gap-4 rounded-2xl p-4 transition-[filter] hover:brightness-95 sm:min-h-32 sm:p-5 ${tone.bg}`}
            >
              <span className={`ui-caps text-2xs ${tone.meta}`}>
                {category.count} {category.count === 1 ? "item" : "items"}
              </span>
              <span className={`display text-2xl leading-[0.95] sm:text-3xl ${tone.title}`}>{category.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
