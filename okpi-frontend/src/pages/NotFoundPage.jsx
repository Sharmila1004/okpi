import { Link } from "react-router-dom";
import Button from "../components/common/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-ember">404</p>
        <h1 className="mt-4 text-4xl font-black text-ink">Page not found</h1>
        <p className="mt-3 text-slate-500">
          The route does not exist or your session no longer has access to it.
        </p>
        <Link className="mt-6 inline-block" to="/">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
