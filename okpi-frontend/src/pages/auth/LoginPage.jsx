import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import { useAuth } from "../../hooks/useAuth";
import { isValidEmail } from "../../utils/validators";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
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
      navigate(location.state?.from?.pathname ?? "/", { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.message ?? "Login failed.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,_#18211f_0%,_#2f473f_40%,_#f4efe6_40%,_#f4efe6_100%)] px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl shadow-ink/20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">
          Welcome Back
        </p>
        <h1 className="mt-3 text-3xl font-black text-ink">Sign in to OKPI</h1>
        <p className="mt-2 text-sm text-slate-500">
          Track objectives, measure KPIs, and keep execution visible.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@company.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Need an account?{" "}
          <Link to="/register" className="font-semibold text-ink">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
