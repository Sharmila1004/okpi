import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as authApi from "../../api/authApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/apiError";
import { ROLES } from "../../utils/constants";
import { normalizeRole } from "../../utils/display";
import { isValidEmail } from "../../utils/validators";

function mapUserToForm(user) {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
  };
}

export default function ProfilePage() {
  const { setUser, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const role = normalizeRole(profile?.role ?? user?.role);
  const isAdmin = role === ROLES.ADMIN;
  const canEditProfile = isAdmin;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const me = await authApi.getCurrentUser();
        if (!cancelled) {
          setProfile(me);
          setForm(mapUserToForm(me));
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(getApiErrorMessage(fetchError, "Could not load profile."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!canEditProfile) {
      setError("Only admins can update profile details.");
      return;
    }
    if (!firstName || !lastName) {
      setError("First and last name are required.");
      return;
    }
    if (email && !isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const updated = await authApi.updateCurrentUser({ firstName, lastName, email });
      setProfile(updated);
      setForm(mapUserToForm(updated));
      const name = [updated.firstName, updated.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
      const nextRole = normalizeRole(updated.role) ?? ROLES.MEMBER;
      setUser((current) => ({
        ...(current ?? {}),
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName ?? "",
        lastName: updated.lastName ?? "",
        name: name || updated.email || "Authenticated User",
        role: nextRole,
        active: updated.active ?? true,
      }));
      setSuccess("Profile updated.");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Update failed."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Your profile</h1>
        </div>
        <form className="card-surface space-y-5 p-6" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          {success && (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                disabled={!canEditProfile}
                required
            />
            <Input
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                disabled={!canEditProfile}
                required
            />
          </div>
          <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={!canEditProfile}
          />
          <p className="text-xs text-slate-500">Only admins can edit profile details.</p>
          {canEditProfile && (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
          )}
        </form>
      </div>
  );
}