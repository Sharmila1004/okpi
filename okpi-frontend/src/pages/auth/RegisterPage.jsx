import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import { useAuth } from "../../hooks/useAuth";
import { isStrongPassword, isValidEmail } from "../../utils/validators";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
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

    if (!isValidEmail(formData.email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setError("Password must be 8+ chars with upper, lower, and number.");
      return;
    }

    try {
      await register(formData);
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.message ?? "Registration failed.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-md rounded-[28px] border border-black/5 bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-moss">
          New Account
        </p>
        <h1 className="mt-3 text-3xl font-black text-ink">Create your OKPI login</h1>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <Input
            label="Full name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Jane Doe"
          />
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
            placeholder="Strong password"
          />
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-ink">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
