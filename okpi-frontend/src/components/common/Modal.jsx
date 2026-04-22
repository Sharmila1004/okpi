export default function Modal({ title, open, children, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card-surface w-full max-w-lg p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            className="text-slate-500"
            onClick={onClose}
            aria-label="Close modal"
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
