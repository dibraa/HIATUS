import { TextBar } from "@/components/admin-skeletons";

/** A label / value row of the receipt's definition lists. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <TextBar width={label} />
      <TextBar width={value} />
    </div>
  );
}

/**
 * Receipt skeleton: the back link and print button, then the paper card with
 * its centred header, payment lines, two items, totals, transaction history
 * and footer — the paid-receipt layout, in the page's own column and rules.
 * Also used by /admin/orders/[id]/receipt, which renders the same page.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading receipt…
      </p>

      <div aria-hidden="true" className="mx-auto max-w-md px-5 py-8">
        <div className="mb-5 flex items-center justify-between">
          <span className="ui-caps text-2xs"><TextBar width="w-28" /></span>
          <span className="skeleton ui-caps rounded-md px-3 py-2 text-2xs">
            <span className="invisible">Print receipt</span>
          </span>
        </div>

        <div className="rounded-lg border border-line bg-card p-6">
          <div className="border-b border-line pb-5 text-center">
            <p className="display text-3xl"><TextBar width="w-44" /></p>
            <p className="mt-1 text-xs"><TextBar width="w-28" /></p>
            <p className="mt-3 font-mono text-sm"><TextBar width="w-20" /></p>
          </div>

          <div className="flex flex-col gap-1 border-b border-line py-4 text-sm">
            <Row label="w-10" value="w-36" />
            <Row label="w-14" value="w-12" />
          </div>

          <ul className="divide-y divide-line py-2">
            {[0, 1].map((i) => (
              <li key={i} className="flex justify-between gap-4 py-2 text-sm">
                <TextBar width="w-40" />
                <TextBar width="w-16" />
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
            <Row label="w-16" value="w-16" />
            <div className="mt-1 flex justify-between border-t border-line pt-3">
              <span className="display text-xl"><TextBar width="w-24" /></span>
              <span className="text-lg font-semibold"><TextBar width="w-20" /></span>
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm"><TextBar width="w-32" /></p>
            <div className="mt-2 text-xs">
              <Row label="w-28" value="w-14" />
              <p className="mt-1"><TextBar width="w-32" /></p>
              <p className="mt-1"><TextBar width="w-56" /></p>
            </div>
            <div className="mt-4 border-t border-line pt-3 text-sm">
              <Row label="w-16" value="w-16" />
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-4 text-center text-xs">
            <TextBar width="w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
