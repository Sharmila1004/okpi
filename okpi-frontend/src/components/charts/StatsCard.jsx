export default function StatsCard({
  label,
  value,
  helper,
  badge,
  badgeTone = "slate",
  icon: Icon,
  accentTone = "slate"
}) {
  const badgeStyles = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700"
  };

  const accentStyles = {
    slate: "bg-ink/5 text-ink",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700"
  };

  return (
    <div className="card-surface flex h-full flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentStyles[accentTone]}`}>
          {Icon ? <Icon className="h-6 w-6" /> : null}
        </div>
        {badge ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[badgeTone]}`}>
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-8">
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-4xl font-black tracking-tight text-ink">{value}</div>
        {helper ? <div className="mt-1 text-sm text-slate-500">{helper}</div> : null}
      </div>
    </div>
  );
}
