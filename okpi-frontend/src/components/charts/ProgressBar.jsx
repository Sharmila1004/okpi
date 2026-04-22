import { formatPercentage } from "../../utils/formatters";

export default function ProgressBar({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value)));

  return (
    <div className="space-y-2">
      <div className="h-2.5 rounded-full bg-slate-200">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-moss to-ember"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <div className="text-sm text-slate-600">{formatPercentage(safeValue)}</div>
    </div>
  );
}
