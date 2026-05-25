import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ShieldCheck, Target } from "lucide-react";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import AuthShell from "../../components/layout/AuthShell";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/apiError";
import { isStrongPassword, isValidEmail } from "../../utils/validators";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.firstName.trim()) {
      setError("Enter your first name.");
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Enter your last name.");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setError("Password must be 8+ chars with upper, lower, and number.");
      return;
    }

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email,
        password: formData.password
      });
      queueMicrotask(() => {
        navigate("/", { replace: true });
      });
    } catch (submitError) {
      console.error("Registration error:", submitError);
      setError(getApiErrorMessage(submitError, "Registration failed."));
    }
  }

  return (
    <AuthShell
      eyebrow="OKPI workspace setup"
      title={"Create your account.\nStart tracking in minutes."}
      description="Set up your workspace to manage objectives, insights, and team execution in one place."
      stats={[
        { value: "3", label: "Teams", icon: Target },
        { value: "18", label: "Objectives", icon: BarChart3 },
        { value: "96%", label: "Visibility", icon: ShieldCheck }
      ]}
    >
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-moss">
            New account
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">
            Create your OKPI login
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Self-service sign-up creates a Member account. Admin and Manager access is
            assigned separately.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <ErrorAlert message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Jane"
              autoComplete="given-name"
            />
            <Input
              label="Last name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              autoComplete="family-name"
            />
          </div>
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
            placeholder="Create a password"
            autoComplete="new-password"
          />
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-ink">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
