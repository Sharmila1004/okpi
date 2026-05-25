import { AlertCircle } from "lucide-react";

export default function ErrorAlert({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-3 rounded-[20px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 shadow-sm"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
