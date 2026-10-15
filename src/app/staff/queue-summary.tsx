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
    <dl className="no-scrollbar mb-3 flex gap-7 overflow-x-auto whitespace-nowrap border-b border-line pb-3">
      <SummaryItem label="open" value={String(open)} />
      <SummaryItem label="wait" value={`${avgWait}m`} />
      <SummaryItem label="late" value={String(late)} muted={late === 0} />
      <SummaryItem label="to collect" value={toCollect} />
      <SummaryItem label="today" value={String(today)} />
    </dl>
  );
}

function SummaryItem({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <dt className="eyebrow text-muted">{label}</dt>
      <dd className={`numeric mt-0.5 text-lg ${muted ? "text-muted" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
