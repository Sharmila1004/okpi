import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { getUsers, assignManagerTeam } from "../../api/authApi";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import { useFetch } from "../../hooks/useFetch";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function AssignTeamsPage() {
  const query = useQuery();
  const preselected = query.get("manager");

  const managersState = useFetch(() => getUsers({ page: 0, size: 1000, role: "MANAGER" }), []);
  const [selectedManagerId, setSelectedManagerId] = useState(preselected ?? null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedManagerId) {
      setMembers([]);
      return;
    }

    setLoadingMembers(true);
    setError("");

    getUsers({ page: 0, size: 1000, role: "MEMBER" })
      .then((resp) => {
        const list = resp.content ?? [];
        // show members that are unassigned or assigned to this manager
        const filtered = list
          .filter((m) => m && (m.managerId == null || String(m.managerId) === String(selectedManagerId)))
          .map((m) => ({ ...m, selected: String(m.managerId) === String(selectedManagerId) }));
        setMembers(filtered);
      })
      .catch((e) => setError("Failed to load members."))
      .finally(() => setLoadingMembers(false));
  }, [selectedManagerId]);

  const managers = managersState.data ?? [];

  useEffect(() => {
    if (!preselected && managers.length === 1) {
      setSelectedManagerId(String(managers[0].id));
    }
  }, [preselected, managers]);

  function toggleMember(id) {
    setMembers((cur) => cur.map((m) => (String(m.id) === String(id) ? { ...m, selected: !m.selected } : m)));
  }

  async function handleSave() {
    if (!selectedManagerId) return setError("Select a manager first.");
    setSaving(true);
    setError("");
    const selectedIds = members.filter((m) => m.selected).map((m) => m.id);
    try {
      await assignManagerTeam(selectedManagerId, selectedIds);
      // reload members
      const resp = await getUsers({ page: 0, size: 1000, role: "MEMBER" });
      const list = resp.content ?? [];
      const filtered = list
        .filter((m) => m && (m.managerId == null || String(m.managerId) === String(selectedManagerId)))
        .map((m) => ({ ...m, selected: String(m.managerId) === String(selectedManagerId) }));
      setMembers(filtered);
      // inform other parts of the app that teams changed
      try {
        window.dispatchEvent(new Event('okpi:teams-updated'));
      } catch (_) {}
    } catch (e) {
      setError("Failed to save team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink">Assign teams</h1>
        <p className="text-slate-500">Choose a manager, then assign available people.</p>
      </div>

      <div className="card-surface p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-ink">Managers</h3>
            {managersState.loading ? (
              <LoadingSpinner label="Loading managers..." />
            ) : (
              <div className="mt-3 space-y-2">
                {managers.map((m) => (
                  <label key={m.id} className={`block rounded-md px-3 py-2 cursor-pointer border ${String(m.id) === String(selectedManagerId) ? "border-ink bg-ink/5" : "border-slate-200"}`}>
                    <input type="radio" name="manager" checked={String(m.id) === String(selectedManagerId)} onChange={() => setSelectedManagerId(String(m.id))} className="mr-2" />
                    <span className="font-semibold">{[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email}</span>
                    <div className="text-xs text-slate-500">{m.email}</div>
                  </label>
                ))}
                {!managers.length ? <div className="text-sm text-slate-500">No managers found.</div> : null}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-ink">Available members</h3>
            <p className="text-sm text-slate-500">Showing members not assigned to other managers.</p>
            <div className="mt-3">
              {selectedManagerId ? (
                loadingMembers ? (
                  <LoadingSpinner label="Loading members..." />
                ) : (
                  <div className="grid gap-2">
                    {members.map((m) => (
                      <label key={m.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                        <input type="checkbox" checked={!!m.selected} onChange={() => toggleMember(m.id)} className="h-4 w-4 rounded border-slate-300" />
                        <div className="min-w-0">
                          <div className="font-semibold text-ink">{[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email}</div>
                          <div className="text-xs text-slate-500">{m.email}</div>
                        </div>
                      </label>
                    ))}
                    {!members.length ? <div className="text-sm text-slate-500">No available members.</div> : null}
                  </div>
                )
              ) : (
                <div className="text-sm text-slate-500">Select a manager to see available members.</div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button variant="secondary" as={Link} to="/admin/users">Back</Button>
              <Button onClick={handleSave} disabled={saving || !selectedManagerId}>{saving ? "Saving..." : "Save"}</Button>
            </div>
            <ErrorAlert message={error} />
          </div>
        </div>
      </div>
    </div>
  );
}
