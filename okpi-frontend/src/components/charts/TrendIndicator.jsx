export default function TrendIndicator({ value = 0 }) {
  const positive = Number(value) >= 0;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}
