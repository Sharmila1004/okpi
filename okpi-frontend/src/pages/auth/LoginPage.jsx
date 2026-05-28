import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, ShieldCheck, Target } from "lucide-react";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import AuthShell from "../../components/layout/AuthShell";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/apiError";
import { isValidEmail } from "../../utils/validators";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isValidEmail(formData.email)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      await login(formData);
      const destination = location.state?.from?.pathname ?? "/";
      queueMicrotask(() => {
        navigate(destination, { replace: true });
      });
    } catch (submitError) {
      console.error("Login error:", submitError);
      setError(getApiErrorMessage(submitError, "Login failed."));
    }
  }

  return (
    <AuthShell
      eyebrow="OKPI workspace access"
      title={"Track your goals.\nMeasure progress."}
      description="Professional objective and insight tracking designed for teams that want execution visible."
      stats={[
      { value: "24", label: "Goals", icon: Target },
        { value: "78%", label: "Progress", icon: BarChart3 },
        { value: "12", label: "Insights", icon: ShieldCheck }
      ]}
    >
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ember">
            Welcome back
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to continue into the dashboard.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <ErrorAlert message={error} />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]"
              />
              Remember me
            </label>
            <span className="text-sm font-semibold text-ink/90">Forgot password?</span>
          </div>

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-ink">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
