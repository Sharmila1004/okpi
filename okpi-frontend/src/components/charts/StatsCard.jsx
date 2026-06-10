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
    <div className="card-surface flex h-full flex-col justify-between p-3 transition-all duration-200 group-hover:border-[#2f67ff]/20 group-hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentStyles[accentTone]}`}>
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </div>
        {badge ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[badgeTone]}`}>
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-2xl font-black tracking-tight text-ink">{value}</div>
        {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
      </div>
    </div>
  );
}
