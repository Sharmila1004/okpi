import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUsersSummary } from "../../api/authApi";
import {
    createKeyResult,
    deleteKeyResult,
    deleteObjective,
    getKeyResults,
    getObjective,
    updateKeyResult,
} from "../../api/objectiveApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { computeObjectiveProgress } from "../../utils/progress";
import StatusBadge from "../../components/common/StatusBadge";
import Table from "../../components/common/Table";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { formatDate, formatNumber } from "../../utils/formatters";
import { humanizeEnum, isManagerOrAdmin } from "../../utils/display";

const EMPTY_KEY_RESULT_FORM = {
    title: "",
    description: "",
    metricType: "NUMBER",
    startValue: "",
    targetValue: "",
    currentValue: "",
    status: "NOT_STARTED",
};

function toNumberOrUndefined(value) {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function getDisplayName(user, fallbackLabel = "User") {
    if (!user) return fallbackLabel;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return name || user.email || fallbackLabel;
}

function summarizeNames(names, limit = 3, emptyLabel = "None") {
    const filteredNames = names.filter(Boolean);
    if (!filteredNames.length) return emptyLabel;
    if (filteredNames.length <= limit) return filteredNames.join(", ");
    return `${filteredNames.slice(0, limit).join(", ")} +${filteredNames.length - limit} more`;
}

function buildUserDirectory(users = []) {
    return new Map(
        users.filter((u) => u?.id != null).map((u) => [String(u.id), u])
    );
}

function resolveUserName(userDirectory, userId, fallbackRole = "User") {
    if (userId == null) return fallbackRole;
    const user = userDirectory.get(String(userId));
    return getDisplayName(user, `${fallbackRole} #${userId}`);
}

// ── Jira status colour ───────────────────────────────────────────────────────
function jiraStatusClass(status) {
    if (!status) return "bg-slate-100 text-slate-500";
    const s = status.toLowerCase();
    if (s === "done" || s === "closed" || s === "resolved")
        return "bg-emerald-100 text-emerald-700";
    if (s === "in progress" || s === "in review")
        return "bg-blue-100 text-blue-700";
    if (s === "blocked" || s === "cancelled")
        return "bg-rose-100 text-rose-600";
    return "bg-slate-100 text-slate-500";
}

// ── Circular progress ring ───────────────────────────────────────────────────
function ProgressRing({ percent = 0, size = 48 }) {
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    const color =
        percent === 100
            ? "#10b981"   // emerald
            : percent >= 70
                ? "#3b82f6"   // blue
                : percent >= 30
                    ? "#f59e0b"   // amber
                    : "#94a3b8";  // slate

    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={5}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={5}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
            {/* percent label — rotated back upright */}
            <text
                x={size / 2}
                y={size / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.22}
                fontWeight="700"
                fill="#1e293b"
                style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
            >
                {percent}%
            </text>
        </svg>
    );
}

// ── Jira ticket dropdown ─────────────────────────────────────────────────────
function JiraTicketDropdown({ jiraIssues, jiraProgressPercent }) {
    const [open, setOpen] = useState(false);

    if (!jiraIssues || jiraIssues.length === 0) return null;

    return (
        <div className="mt-2">
            {/* Toggle button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
                <svg
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {jiraIssues.length} Jira ticket{jiraIssues.length !== 1 ? "s" : ""}
                {jiraProgressPercent != null && (
                    <span className="ml-1 text-slate-400">· avg {jiraProgressPercent}%</span>
                )}
            </button>

            {/* Dropdown content */}
            {open && (
                <div className="mt-2 space-y-1.5 pl-1">
                    {jiraIssues.map((issue) => (
                        <div
                            key={issue.issueKey}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        >
                            {/* Issue key */}
                            <span className="shrink-0 font-mono font-semibold text-blue-600 text-xs">
                {issue.issueKey}
              </span>

                            {/* Summary */}
                            <span className="flex-1 text-slate-700 truncate text-xs">
                {issue.summary || "—"}
              </span>

                            {/* Mini progress bar */}
                            {issue.progressPercent != null && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-blue-500 transition-all"
                                            style={{ width: `${Math.min(100, issue.progressPercent)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 w-7 text-right">
                    {issue.progressPercent}%
                  </span>
                                </div>
                            )}

                            {/* Status badge */}
                            <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${jiraStatusClass(
                                    issue.status
                                )}`}
                            >
                {issue.status || "Unknown"}
              </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
// ────────────────────────────────────────────────────────────────────────────

export default function ObjectiveDetailPage() {
    const navigate = useNavigate();
    const { objectiveId } = useParams();
    const { user, accessToken } = useAuth();
    const canManageObjectives = isManagerOrAdmin(user?.role);
    const authKey = accessToken ?? "";

    const objectiveState = useFetch(() => getObjective(objectiveId), [objectiveId, authKey]);
    const keyResultsState = useFetch(() => getKeyResults(objectiveId), [objectiveId, authKey]);

    const [objectiveError, setObjectiveError] = useState("");
    const [keyResultError, setKeyResultError] = useState("");
    const [keyResultForm, setKeyResultForm] = useState(EMPTY_KEY_RESULT_FORM);
    const [editingKeyResult, setEditingKeyResult] = useState(null);
    const [keyResultModalOpen, setKeyResultModalOpen] = useState(false);
    const [savingKeyResult, setSavingKeyResult] = useState(false);

    const objective = objectiveState.data;
    const keyResults = useMemo(() => keyResultsState.data ?? [], [keyResultsState.data]);

    const assigneeIds = useMemo(
        () =>
            [
                ...new Set(
                    (objective?.assigneeIds ?? [])
                        .map((id) => Number(id))
                        .filter((id) => Number.isFinite(id))
                ),
            ],
        [objective?.assigneeIds]
    );

    const currentUserId = user?.id == null ? "" : String(user.id);
    const canUpdateProgress =
        canManageObjectives ||
        (currentUserId && assigneeIds.map(String).includes(currentUserId)) ||
        (currentUserId && String(objective?.ownerId ?? "") === currentUserId);

    const progressOnlyMode = Boolean(editingKeyResult && !canManageObjectives);

    const assigneeUsersState = useFetch(
        () => (assigneeIds.length ? getUsersSummary(assigneeIds) : Promise.resolve([])),
        [authKey, assigneeIds.join(",")]
    );
    const assigneeDirectory = useMemo(
        () => buildUserDirectory(assigneeUsersState.data ?? []),
        [assigneeUsersState.data]
    );
    const assigneeNames = assigneeIds.map((id) =>
        resolveUserName(assigneeDirectory, id, "Member")
    );

    function openCreateKeyResultModal() {
        setEditingKeyResult(null);
        setKeyResultForm(EMPTY_KEY_RESULT_FORM);
        setKeyResultError("");
        setKeyResultModalOpen(true);
    }

    function openEditKeyResultModal(keyResult) {
        setEditingKeyResult(keyResult);
        setKeyResultForm({
            title: keyResult.title ?? "",
            description: keyResult.description ?? "",
            metricType: keyResult.metricType ?? "NUMBER",
            startValue: keyResult.startValue ?? "",
            targetValue: keyResult.targetValue ?? "",
            currentValue: keyResult.currentValue ?? "",
            status: keyResult.status ?? "NOT_STARTED",
        });
        setKeyResultError("");
        setKeyResultModalOpen(true);
    }

    function closeKeyResultModal() {
        setKeyResultModalOpen(false);
        setEditingKeyResult(null);
        setKeyResultForm(EMPTY_KEY_RESULT_FORM);
        setKeyResultError("");
    }

    async function handleDeleteObjective() {
        if (!window.confirm("Delete this objective?")) return;
        try {
            await deleteObjective(objectiveId);
            navigate("/objectives");
        } catch (error) {
            setObjectiveError(error.response?.data?.message ?? "Failed to delete objective.");
        }
    }

    async function handleDeleteKeyResult(keyResultId) {
        if (!window.confirm("Delete this key result?")) return;
        try {
            await deleteKeyResult(objectiveId, keyResultId);
            const prev = keyResultsState.data ?? [];
            const updated = prev.filter((kr) => kr.id !== keyResultId);
            keyResultsState.setData(updated);
            try {
                objectiveState.setData((cur) => ({
                    ...(cur ?? {}),
                    progress: computeObjectiveProgress(updated),
                }));
            } catch (e) {}
            try {
                const fresh = await getObjective(objectiveId);
                objectiveState.setData(fresh);
                window.dispatchEvent(
                    new CustomEvent("okpi:objective-updated", { detail: { objectiveId, objective: fresh } })
                );
            } catch (e) {}
        } catch (error) {
            setKeyResultError(error.response?.data?.message ?? "Failed to delete key result.");
        }
    }

    async function handleKeyResultSubmit(event) {
        event.preventDefault();
        setSavingKeyResult(true);
        setKeyResultError("");

        const payload =
            editingKeyResult && !canManageObjectives
                ? {
                    currentValue: toNumberOrUndefined(keyResultForm.currentValue),
                    status: keyResultForm.status,
                }
                : editingKeyResult
                    ? {
                        title: keyResultForm.title.trim(),
                        description: keyResultForm.description.trim(),
                        currentValue: toNumberOrUndefined(keyResultForm.currentValue),
                        targetValue: toNumberOrUndefined(keyResultForm.targetValue),
                        status: keyResultForm.status,
                    }
                    : {
                        title: keyResultForm.title.trim(),
                        description: keyResultForm.description.trim(),
                        metricType: keyResultForm.metricType,
                        startValue: toNumberOrUndefined(keyResultForm.startValue),
                        targetValue: toNumberOrUndefined(keyResultForm.targetValue),
                    };

        try {
            const saved = editingKeyResult
                ? await updateKeyResult(objectiveId, editingKeyResult.id, payload)
                : await createKeyResult(objectiveId, payload);

            const prev = keyResultsState.data ?? [];
            const updated = editingKeyResult
                ? prev.map((kr) => (kr.id === saved.id ? saved : kr))
                : [saved, ...prev];
            keyResultsState.setData(updated);

            try {
                objectiveState.setData((cur) => ({
                    ...(cur ?? {}),
                    progress: computeObjectiveProgress(updated),
                }));
            } catch (e) {}
            try {
                const fresh = await getObjective(objectiveId);
                objectiveState.setData(fresh);
                window.dispatchEvent(
                    new CustomEvent("okpi:objective-updated", { detail: { objectiveId, objective: fresh } })
                );
            } catch (e) {}

            closeKeyResultModal();
        } catch (error) {
            setKeyResultError(error.response?.data?.message ?? "Failed to save key result.");
        } finally {
            setSavingKeyResult(false);
        }
    }

    if (objectiveState.loading || keyResultsState.loading)
        return <LoadingSpinner label="Loading goal..." />;
    if (objectiveState.error || keyResultsState.error)
        return <ErrorAlert message={objectiveState.error || keyResultsState.error} />;
    if (!objective) return <ErrorAlert message="Goal not found." />;

    return (
        <div className="space-y-6">
            {/* ── Objective header ── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-black text-ink">{objective.title}</h1>
                        <StatusBadge status={objective.status} />
                    </div>
                    <p className="mt-2 text-slate-500">{objective.description}</p>
                    <div className="mt-2 space-y-2 text-sm text-slate-500">
                        <p>Start {formatDate(objective.startDate)} · Due {formatDate(objective.endDate)}</p>
                        <p>Assigned to: {summarizeNames(assigneeNames, 4, "No assigned users")}</p>
                    </div>
                </div>
                {canManageObjectives ? (
                    <div className="flex flex-wrap gap-3">
                        <Link to={`/objectives/${objectiveId}/edit`}>
                            <Button variant="secondary">Edit</Button>
                        </Link>
                        <Button variant="danger" onClick={handleDeleteObjective}>
                            Delete
                        </Button>
                    </div>
                ) : null}
            </div>

            <ErrorAlert message={objectiveError} />

            {/* ── Key results section ── */}
            <section className="card-surface p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-ink">Key results</h2>
                        <p className="mt-1 text-sm text-slate-500">Track performance against targets</p>
                    </div>
                    {canManageObjectives ? (
                        <Button variant="accent" onClick={openCreateKeyResultModal}>
                            New key result
                        </Button>
                    ) : null}
                </div>

                <div className="mt-4">
                    <Table
                        columns={[
                            {
                                key: "title",
                                label: "Key result",
                                render: (row) => (
                                    <div className="space-y-1">
                                        <div className="font-semibold text-ink">{row.title}</div>
                                        <div className="text-sm text-slate-500">{row.description || "-"}</div>
                                        {/* CHANGED: Jira tickets now in a collapsible dropdown */}
                                        <JiraTicketDropdown
                                            jiraIssues={row.jiraIssues}
                                            jiraProgressPercent={row.jiraProgressPercent}
                                        />
                                    </div>
                                ),
                            },
                            {
                                // CHANGED: replaces Start / Target / Current columns
                                // Shows Jira avg % as a ring when tickets exist, else KR manual %
                                key: "progress",
                                label: "Progress",
                                render: (row) => {
                                    const hasJira =
                                        row.jiraIssues?.length > 0 && row.jiraProgressPercent != null;
                                    const percent = hasJira
                                        ? row.jiraProgressPercent
                                        : row.targetValue && Number(row.targetValue) > 0
                                            ? Math.round(
                                                (Number(row.currentValue ?? 0) / Number(row.targetValue)) * 100
                                            )
                                            : null;

                                    if (percent == null) return <span className="text-slate-400 text-sm">—</span>;

                                    return (
                                        <div className="flex flex-col items-center gap-0.5">
                                            <ProgressRing percent={Math.min(100, Math.max(0, percent))} size={52} />
                                            {hasJira && (
                                                <span className="text-[10px] text-slate-400">from Jira</span>
                                            )}
                                        </div>
                                    );
                                },
                            },
                            {
                                key: "status",
                                label: "Status",
                                // CHANGED: uses computedStatus (auto-derived from Jira %) when available
                                render: (row) => (
                                    <StatusBadge status={row.computedStatus ?? row.status} />
                                ),
                            },
                            canUpdateProgress
                                ? {
                                    key: "actions",
                                    label: "Actions",
                                    render: (row) => (
                                        <div className="flex flex-wrap gap-2">
                                            {canManageObjectives ? (
                                                <>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => openEditKeyResultModal(row)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteKeyResult(row.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openEditKeyResultModal(row)}
                                                >
                                                    Update progress
                                                </Button>
                                            )}
                                        </div>
                                    ),
                                }
                                : null,
                        ].filter(Boolean)}
                        rows={keyResults}
                        emptyMessage="No key results for this goal."
                    />
                </div>
            </section>

            {/* ── Key result modal ── */}
            <Modal
                title={
                    progressOnlyMode
                        ? "Update progress"
                        : editingKeyResult
                            ? "Edit key result"
                            : "New key result"
                }
                open={keyResultModalOpen}
                onClose={closeKeyResultModal}
            >
                <form className="space-y-4" onSubmit={handleKeyResultSubmit}>
                    <ErrorAlert message={keyResultError} />

                    {progressOnlyMode ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <div className="text-sm font-semibold text-ink">{keyResultForm.title}</div>
                            <div className="mt-1 text-sm text-slate-500">
                                {keyResultForm.description || "Progress update"}
                            </div>
                        </div>
                    ) : (
                        <>
                            <Input
                                label="Title"
                                value={keyResultForm.title}
                                onChange={(e) =>
                                    setKeyResultForm((c) => ({ ...c, title: e.target.value }))
                                }
                                placeholder="Reduce onboarding drop-off"
                                required
                            />
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-ink">Description</span>
                                <textarea
                                    value={keyResultForm.description}
                                    onChange={(e) =>
                                        setKeyResultForm((c) => ({ ...c, description: e.target.value }))
                                    }
                                    rows={4}
                                    className="control-surface min-h-[120px] resize-y"
                                    placeholder="Explain why this key result matters."
                                />
                            </label>
                        </>
                    )}

                    {editingKeyResult ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Current value"
                                type="number"
                                value={keyResultForm.currentValue}
                                onChange={(e) =>
                                    setKeyResultForm((c) => ({ ...c, currentValue: e.target.value }))
                                }
                                placeholder="0"
                            />
                            {!progressOnlyMode ? (
                                <Input
                                    label="Target value"
                                    type="number"
                                    value={keyResultForm.targetValue}
                                    onChange={(e) =>
                                        setKeyResultForm((c) => ({ ...c, targetValue: e.target.value }))
                                    }
                                    placeholder="100"
                                />
                            ) : null}
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-ink">Metric type</span>
                                <select
                                    value={keyResultForm.metricType}
                                    onChange={(e) =>
                                        setKeyResultForm((c) => ({ ...c, metricType: e.target.value }))
                                    }
                                    className="control-surface"
                                >
                                    <option value="NUMBER">Number</option>
                                    <option value="PERCENTAGE">Percentage</option>
                                    <option value="CURRENCY">Currency</option>
                                    <option value="BOOLEAN">Boolean</option>
                                </select>
                            </label>
                            <Input
                                label="Start value"
                                type="number"
                                value={keyResultForm.startValue}
                                onChange={(e) =>
                                    setKeyResultForm((c) => ({ ...c, startValue: e.target.value }))
                                }
                                placeholder="0"
                            />
                            <Input
                                label="Target value"
                                type="number"
                                value={keyResultForm.targetValue}
                                onChange={(e) =>
                                    setKeyResultForm((c) => ({ ...c, targetValue: e.target.value }))
                                }
                                placeholder="100"
                            />
                        </div>
                    )}

                    {editingKeyResult ? (
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-ink">Status</span>
                            <select
                                value={keyResultForm.status}
                                onChange={(e) =>
                                    setKeyResultForm((c) => ({ ...c, status: e.target.value }))
                                }
                                className="control-surface"
                            >
                                <option value="NOT_STARTED">Not started</option>
                                <option value="ON_TRACK">On track</option>
                                <option value="AT_RISK">At risk</option>
                                <option value="OFF_TRACK">Off track</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </label>
                    ) : null}

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="secondary" type="button" onClick={closeKeyResultModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={savingKeyResult}>
                            {savingKeyResult ? "Saving..." : "Save key result"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
