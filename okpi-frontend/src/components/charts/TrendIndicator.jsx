import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function TrendIndicator({ value = 0 }) {
  const positive = Number(value) >= 0;
  const numericValue = Number(value);
  const displayValue = `${positive && numericValue > 0 ? "+" : ""}${numericValue}%`;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        positive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-rose-50 text-rose-700 ring-rose-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {displayValue}
    </span>
  );
}
