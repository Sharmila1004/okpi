import { Circle, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { STATUS_COLORS } from "../../utils/constants";

export default function StatusBadge({ status = "DRAFT" }) {
  const style = STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT;
  const meta = {
    NOT_STARTED: { label: "Not started", icon: Circle },
    ON_TRACK: { label: "On Track", icon: CircleCheck },
    COMPLETED: { label: "Completed", icon: CircleCheck },
    AT_RISK: { label: "At Risk", icon: TriangleAlert },
    OFF_TRACK: { label: "Off Track", icon: CircleAlert },
    BLOCKED: { label: "Blocked", icon: CircleAlert },
    DRAFT: { label: "Draft", icon: Circle }
  };
  const { label, icon: Icon } = meta[status] ?? meta.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
