import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, LogOut, Target, BarChart3, User, Users } from "lucide-react";
import { NAV_ITEMS, ROLES } from "../../utils/constants";
import { normalizeRole } from "../../utils/display";
import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = normalizeRole(user?.role) === ROLES.ADMIN;
  const items = [
    ...NAV_ITEMS,
    { label: "Account", to: "/account" },
    ...(isAdmin ? [{ label: "Users", to: "/admin/users" }] : [])
  ];

  const icons = {
    Dashboard: LayoutGrid,
    Objectives: Target,
    Insights: BarChart3,
    Account: User,
    Users
  };

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sticky top-6 h-fit rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:p-5">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
          <Target className="h-6 w-6" />
        </span>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
            OKPI
          </div>
          <div className="text-xl font-black tracking-tight text-ink">Hub</div>
        </div>
      </div>

      <nav className="mt-5 space-y-2">
        {items.map((item) => {
          const Icon = icons[item.label] ?? LayoutGrid;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[18px] px-4 py-3 text-[15px] font-semibold transition ${
                  isActive
                    ? "bg-ink text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-slate-200 pt-4">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-[18px] px-4 py-3 text-[15px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-ink"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Log out
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
