import { formatPercentage } from "../../utils/formatters";

export default function ProgressBar({ value = 0, className = "" }) {
  const safeValue = Math.max(0, Math.min(100, Number(value)));

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-emerald-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <div className="text-sm font-medium text-slate-600">{formatPercentage(safeValue)}</div>
    </div>
  );
}
