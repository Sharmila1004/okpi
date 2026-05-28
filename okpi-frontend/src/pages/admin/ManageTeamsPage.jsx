import { useEffect, useState } from "react";
import { getUsers, assignManagerTeam, updateUserByAdmin } from "../../api/authApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getApiErrorMessage } from "../../utils/apiError";
import { ChevronLeft, UserPlus, UserMinus } from "lucide-react";

function getFullName(user) {
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return name || user?.email || "Unknown";
}

export default function ManageTeamsPage() {
    const [managers, setManagers] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [loadingManagers, setLoadingManagers] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [selectedManager, setSelectedManager] = useState(null);

    useEffect(() => {
        setLoadingManagers(true);
        getUsers({ page: 0, size: 1000, role: "MANAGER" })
            .then((resp) => setManagers(resp.content ?? []))
            .catch((err) => setError(getApiErrorMessage(err, "Failed to load managers.")))
            .finally(() => setLoadingManagers(false));
    }, []);

    useEffect(() => {
        setLoadingMembers(true);
        getUsers({ page: 0, size: 1000, role: "MEMBER" })
            .then((resp) => setAllMembers(resp.content ?? []))
            .catch((err) => setError(getApiErrorMessage(err, "Failed to load members.")))
            .finally(() => setLoadingMembers(false));
    }, []);

    function getMembersForManager(managerId) {
        return allMembers.filter(
            (m) => String(m.managerId ?? m.manager?.id ?? "") === String(managerId)
        );
    }

    function getUnassignedMembers() {
        return allMembers.filter(
            (m) => !m.managerId && !m.manager?.id
        );
    }

    async function assignMember(member) {
        if (!selectedManager) return;
        setSaving(true);
        setError("");
        try {
            const currentMemberIds = getMembersForManager(selectedManager.id).map((m) => m.id);
            const newIds = [...currentMemberIds, member.id];
            await assignManagerTeam(selectedManager.id, newIds);
            setAllMembers((prev) =>
                prev.map((m) =>
                    String(m.id) === String(member.id)
                        ? { ...m, managerId: selectedManager.id }
                        : m
                )
            );
        } catch (err) {
            try {
                await updateUserByAdmin(member.id, { managerId: selectedManager.id });
                setAllMembers((prev) =>
                    prev.map((m) =>
                        String(m.id) === String(member.id)
                            ? { ...m, managerId: selectedManager.id }
                            : m
                    )
                );
            } catch (err2) {
                setError(getApiErrorMessage(err2, "Failed to assign member."));
            }
        } finally {
            setSaving(false);
        }
    }

    async function unassignMember(member) {
        if (!selectedManager) return;
        setSaving(true);
        setError("");
        try {
            const currentMemberIds = getMembersForManager(selectedManager.id).map((m) => m.id);
            const newIds = currentMemberIds.filter((id) => String(id) !== String(member.id));
            await assignManagerTeam(selectedManager.id, newIds);
            setAllMembers((prev) =>
                prev.map((m) =>
                    String(m.id) === String(member.id) ? { ...m, managerId: null } : m
                )
            );
        } catch (err) {
            try {
                await updateUserByAdmin(member.id, { managerId: null });
                setAllMembers((prev) =>
                    prev.map((m) =>
                        String(m.id) === String(member.id) ? { ...m, managerId: null } : m
                    )
                );
            } catch (err2) {
                setError(getApiErrorMessage(err2, "Failed to unassign member."));
            }
        } finally {
            setSaving(false);
        }
    }

    const isLoading = loadingManagers || loadingMembers;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-ink">Manage Teams</h1>
                <p className="text-slate-500">Assign and unassign members to managers.</p>
            </div>

            <ErrorAlert message={error} />

            {isLoading ? (
                <LoadingSpinner label="Loading teams..." />
            ) : selectedManager ? (
                // — Manager detail view —
                <div className="space-y-6">
                    <button
                        type="button"
                        onClick={() => setSelectedManager(null)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        All managers
                    </button>

                    <div className="card-surface p-6">
                        <h2 className="text-xl font-black text-ink">{getFullName(selectedManager)}</h2>
                        <p className="text-sm text-slate-500">{selectedManager.email}</p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Current team members */}
                        <div className="card-surface p-6 space-y-4">
                            <h3 className="text-lg font-bold text-ink">Team members</h3>
                            {getMembersForManager(selectedManager.id).length === 0 ? (
                                <p className="text-sm text-slate-500">No members assigned yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {getMembersForManager(selectedManager.id).map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3"
                                        >
                                            <div>
                                                <div className="font-semibold text-ink text-sm">{getFullName(member)}</div>
                                                <div className="text-xs text-slate-500">{member.email}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => unassignMember(member)}
                                                disabled={saving}
                                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            >
                                                <UserMinus className="h-4 w-4" />
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Unassigned members */}
                        <div className="card-surface p-6 space-y-4">
                            <h3 className="text-lg font-bold text-ink">Unassigned members</h3>
                            {getUnassignedMembers().length === 0 ? (
                                <p className="text-sm text-slate-500">No unassigned members available.</p>
                            ) : (
                                <div className="space-y-2">
                                    {getUnassignedMembers().map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3"
                                        >
                                            <div>
                                                <div className="font-semibold text-ink text-sm">{getFullName(member)}</div>
                                                <div className="text-xs text-slate-500">{member.email}</div>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => assignMember(member)}
                                                disabled={saving}
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                Assign
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // — Managers list view —
                <div className="space-y-3">
                    {managers.length === 0 ? (
                        <p className="text-sm text-slate-500">No managers found.</p>
                    ) : (
                        managers.map((manager) => {
                            const memberCount = getMembersForManager(manager.id).length;
                            return (
                                <button
                                    key={manager.id}
                                    type="button"
                                    onClick={() => setSelectedManager(manager)}
                                    className="w-full text-left rounded-[22px] border border-slate-200 bg-white px-5 py-4 transition hover:border-[#2f67ff]/30 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f67ff]/30"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-lg font-black tracking-tight text-ink">
                                                {getFullName(manager)}
                                            </div>
                                            <div className="text-sm text-slate-500">{manager.email}</div>
                                        </div>
                                        <div className="text-right text-sm text-slate-500">
                                            <div className="font-semibold text-ink">{memberCount}</div>
                                            <div>{memberCount === 1 ? "member" : "members"}</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
