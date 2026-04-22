export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-moss border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
