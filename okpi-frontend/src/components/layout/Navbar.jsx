import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronDown, Target } from "lucide-react";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";
import { getRoleLabel, isManagerOrAdmin } from "../../utils/display";

function getHeaderMeta(pathname) {
  if (pathname === "/") {
    return {
      title: "Dashboard Overview"
    };
  }

  if (pathname.startsWith("/objectives")) {
    return {
      title: "Objectives"
    };
  }

  if (pathname.startsWith("/insights") || pathname.startsWith("/kpis")) {
    return {
      title: "Insights"
    };
  }

  if (pathname.startsWith("/admin/users")) {
    return {
      title: "Users"
    };
  }

  if (pathname.startsWith("/account")) {
    return {
      title: "Account"
    };
  }

  return {
    title: "OKPI Hub"
  };
}

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const headerMeta = getHeaderMeta(location.pathname);
  const canCreateObjectives = isManagerOrAdmin(user?.role);
  const action = (() => {
    if (location.pathname === "/") {
      return canCreateObjectives
        ? { label: "New objective", to: "/objectives/new" }
        : { label: "New insight", to: "/insights/new" };
    }

    if (location.pathname.startsWith("/objectives")) {
      return canCreateObjectives ? { label: "New objective", to: "/objectives/new" } : null;
    }

    if (location.pathname.startsWith("/insights") || location.pathname.startsWith("/kpis")) {
      return { label: "New insight", to: "/insights/new" };
    }

    return null;
  })();
  const initials = (user?.name ?? "Guest")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="border-b border-white/10 bg-[#1a2030]/95 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-inner shadow-black/10">
            <Target className="h-5 w-5" />
          </span>
          <div className="hidden leading-tight sm:block">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
              OKPI
            </div>
            <div className="text-sm font-semibold text-white">Hub</div>
          </div>
        </Link>

        <div className="min-w-0 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 truncate text-sm font-semibold text-white sm:text-base">
            <span className="truncate">{headerMeta.title}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/55" />
          </div>
          <div className="hidden text-xs text-white/55 md:block">
            {getRoleLabel(user?.role) ?? "Public"}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="secondary"
            size="icon"
            className="!bg-white/10 !text-white !ring-white/10 hover:!bg-white/15"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          {action ? (
            <Link to={action.to}>
              <Button variant="accent" className="whitespace-nowrap">
                {action.label}
              </Button>
            </Link>
          ) : null}
          <Link
            to="/account"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/10 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 transition hover:bg-white/15"
            title="Account settings"
          >
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
