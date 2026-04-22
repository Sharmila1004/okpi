import { STATUS_COLORS } from "../../utils/constants";

export default function StatusBadge({ status = "DRAFT" }) {
  const style = STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
