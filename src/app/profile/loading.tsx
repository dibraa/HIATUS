/** Account skeleton: identity, section navigation, and the details panel. */
export default function Loading() {
  return <div aria-busy="true" className="mx-auto max-w-6xl py-2">
    <p className="sr-only" role="status">Loading account...</p>
    <div aria-hidden="true">
      <div className="mb-8 border-b border-line pb-6">
        <div className="skeleton mb-6 h-10 w-56 rounded-md" />
        <div className="flex items-center gap-4"><div className="skeleton h-14 w-14 rounded-xl" /><div className="space-y-2"><div className="skeleton h-5 w-40 rounded" /><div className="skeleton h-4 w-48 rounded" /></div></div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <div className="flex gap-2 lg:flex-col">{[0, 1, 2].map(index => <div key={index} className="skeleton h-11 min-w-0 flex-1 rounded-lg lg:flex-none" />)}</div>
        <div className="space-y-5 rounded-2xl border border-line bg-card p-5 sm:p-8"><div className="skeleton h-8 w-36 rounded" />{[0, 1, 2].map(index => <div key={index} className="skeleton h-[70px] max-w-xl rounded-md" />)}<div className="skeleton h-11 w-36 rounded-md" /></div>
      </div>
    </div>
  </div>;
}
