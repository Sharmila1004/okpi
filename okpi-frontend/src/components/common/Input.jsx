export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
      <input
        className={`w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none ring-0 transition placeholder:text-slate-400 focus:border-moss ${className}`}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}
