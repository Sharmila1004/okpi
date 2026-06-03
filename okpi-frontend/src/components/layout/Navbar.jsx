import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronDown, Target } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";
import { getRoleLabel, isManagerOrAdmin } from "../../utils/display";
import { getNotifications } from "../../api/authApi"; // ✅ ADD

function getHeaderMeta(pathname) {
  if (pathname === "/") {
    return { title: "Dashboard Overview" };
  }
  if (pathname.startsWith("/objectives")) {
    return { title: "Goals" };
  }
  if (pathname.startsWith("/insights") || pathname.startsWith("/kpis")) {
    return { title: "Insights" };
  }
  if (pathname.startsWith("/admin/users")) {
    return { title: "Users" };
  }
  if (pathname.startsWith("/account")) {
    return { title: "Account" };
  }
  return { title: "OKPI Hub" };
}

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const headerMeta = getHeaderMeta(location.pathname);

  const canCreateObjectives = isManagerOrAdmin(user?.role);

  // NEW STATE
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // FETCH NOTIFICATIONS
  useEffect(() => {
    getNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]));
  }, []);

  const action = (() => {
    if (location.pathname === "/") {
      return canCreateObjectives
          ? { label: "New goal", to: "/objectives/new" }
          : { label: "New insight", to: "/insights/new" };
    }

    if (location.pathname.startsWith("/objectives")) {
      return canCreateObjectives
          ? { label: "New goal", to: "/objectives/new" }
          : null;
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

          {/* LEFT */}
          <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
            <Target className="h-5 w-5" />
          </span>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase text-white/55">OKPI</div>
              <div className="text-sm">Hub</div>
            </div>
          </Link>

          {/* CENTER */}
          <div className="text-center">
            <div className="flex items-center gap-2">
              <span>{headerMeta.title}</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="text-xs text-white/55">
              {getRoleLabel(user?.role) ?? "Public"}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            {/* 🔔 NOTIFICATIONS */}
            <div className="relative">
              <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />

                {/* 🔴 RED BADGE */}
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full">
                  {notifications.length}
                </span>
                )}
              </Button>

              {/* DROPDOWN */}
              {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-black border rounded-lg shadow-lg p-3 z-50">
                    <h3 className="font-semibold mb-2">Notifications</h3>

                    {notifications.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No notifications
                        </p>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className="p-2 border-b text-sm">
                              {n.message}
                            </div>
                        ))
                    )}
                  </div>
              )}
            </div>

            {/* ACTION BUTTON */}
            {action ? (
                <Link to={action.to}>
                  <Button variant="accent">
                    {action.label}
                  </Button>
                </Link>
            ) : null}

            {/* PROFILE */}
            <Link
                to="/account"
                className="flex h-11 w-11 items-center justify-center rounded bg-white/10"
            >
              {initials}
            </Link>

          </div>
        </div>
      </header>
  );
}
