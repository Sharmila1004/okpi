export default function StatsCard({ label, value, helper }) {
  return (
    <div className="card-surface p-5">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-ink">{value}</div>
      {helper ? <div className="mt-1 text-sm text-slate-500">{helper}</div> : null}
    </div>
  );
}
