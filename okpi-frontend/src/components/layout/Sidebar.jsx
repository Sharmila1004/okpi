import { NavLink } from "react-router-dom";
import { NAV_ITEMS, ROLES } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar() {
  const { user } = useAuth();
  const items =
    user?.role === ROLES.ADMIN
      ? [...NAV_ITEMS, { label: "Users", to: "/admin/users" }]
      : NAV_ITEMS;

  return (
    <aside className="card-surface h-fit p-4">
      <nav className="space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive ? "bg-ink text-white" : "text-slate-600 hover:bg-sand"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
