import { Link } from "react-router-dom";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="page-shell flex items-center justify-between py-4">
        <Link to="/" className="text-lg font-black tracking-wide text-ink">
          OKPI
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-ink">{user?.name ?? "Guest"}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {user?.role ?? "Public"}
            </div>
          </div>
          {user ? (
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
