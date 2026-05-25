export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
      <span>{label}</span>
    </div>
  );
}
