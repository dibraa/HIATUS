export function QueueSummary({
  open,
  avgWait,
  late,
  toCollect,
  today,
}: {
  open: number;
  avgWait: number;
  late: number;
  toCollect: string;
  today: number;
}) {
  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
      <SummaryCard label="Open" value={String(open)} />
      <SummaryCard label="Wait time" value={`${avgWait}m avg`} />
      <SummaryCard label="Late" value={String(late)} alert={late > 0} />
      <SummaryCard label="To collect" value={toCollect} />
      <SummaryCard label="Today total" value={String(today)} />
    </dl>
  );
}

function SummaryCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div
      className={`min-w-0 rounded-2xl px-4 py-3 ring-1 ${
        alert ? "bg-warning-soft-bg ring-warning" : "bg-card ring-line"
      }`}
    >
      <dt className={`ui-caps text-2xs ${alert ? "text-warning-soft-fg" : "text-muted"}`}>{label}</dt>
      <dd className={`numeric mt-0.5 truncate text-2xl ${alert ? "text-warning" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
