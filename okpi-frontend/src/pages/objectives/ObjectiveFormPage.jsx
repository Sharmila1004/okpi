import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    createObjective,
    getObjective,
    updateObjective,
} from "../../api/objectiveApi";
import { getUsers, getTeamMembers } from "../../api/authApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";
import { normalizeRole } from "../../utils/display";

const OBJECTIVE_STATUSES = [
    { value: "DRAFT", label: "Draft" },
    { value: "ON_TRACK", label: "On track" },
    { value: "AT_RISK", label: "At risk" },
    { value: "OFF_TRACK", label: "Off track" },
    { value: "COMPLETED", label: "Completed" },
];

const OBJECTIVE_DEFAULT_DURATION_DAYS = 90;

function createDateInputValue(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().slice(0, 10);
}

function formatDateInput(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
}

function createInitialForm() {
    return {
        title: "",
        description: "",
        status: "DRAFT",
        startDate: createDateInputValue(0),
        endDate: createDateInputValue(OBJECTIVE_DEFAULT_DURATION_DAYS),
        assigneeIds: [],
    };
}

function summarizeNames(names, limit = 4, emptyLabel = "No assignees selected") {
    const filtered = names.filter(Boolean);
    if (!filtered.length) return emptyLabel;
    if (filtered.length <= limit) return filtered.join(", ");
    return `${filtered.slice(0, limit).join(", ")} +${filtered.length - limit} more`;
}

export default function ObjectiveFormPage() {
    const navigate = useNavigate();
    const { objectiveId } = useParams();
    const isEditMode = Boolean(objectiveId);
    const { user } = useAuth();
    const role = normalizeRole(user?.role);
    const isAdmin = role === ROLES.ADMIN;
    const isManager = role === ROLES.MANAGER;

    const [formData, setFormData] = useState(() => createInitialForm());
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [usersError, setUsersError] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // whether this objective was assigned TO the manager by admin (not created by them)
    const [isAssignedToMe, setIsAssignedToMe] = useState(false);

    // Load the correct user list based on role
    useEffect(() => {
        async function loadUsers() {
            setLoadingUsers(true);
            setUsersError("");
            try {
                if (isAdmin) {
                    const resp = await getUsers({ page: 0, size: 1000, role: "MANAGER" });
                    setAssignableUsers(resp.content ?? []);
                } else if (isManager && user?.id) {
                    const members = await getTeamMembers(user.id);
                    setAssignableUsers(members ?? []);
                } else {
                    setAssignableUsers([]);
                }
            } catch (err) {
                setUsersError(err.response?.data?.message ?? "Failed to load users.");
            } finally {
                setLoadingUsers(false);
            }
        }
        loadUsers();
    }, [isAdmin, isManager, user?.id]);

    useEffect(() => {
        if (!isEditMode) return;
        async function loadObjective() {
            try {
                const objective = await getObjective(objectiveId);

                const myId = String(user?.id);
                const objAssigneeIds = (objective.assigneeIds ?? []).map(String);
                const iAmAssignee = objAssigneeIds.includes(myId);
                const iAmOwner = String(objective.ownerId) === myId;

                // manager was assigned this by admin — not the owner
                const assignedToMe = isManager && iAmAssignee && !iAmOwner;
                setIsAssignedToMe(assignedToMe);

                // if manager was assigned this by admin, strip the manager's own id
                // from pre-checked boxes — the team member checkboxes should only
                // show member-level ids, not the manager themselves
                const preCheckedIds = assignedToMe
                    ? objAssigneeIds.filter((id) => id !== myId)
                    : objAssigneeIds;

                setFormData({
                    title: objective.title ?? "",
                    description: objective.description ?? "",
                    status: objective.status ?? "DRAFT",
                    startDate:
                        formatDateInput(objective.startDate) || createDateInputValue(0),
                    endDate:
                        formatDateInput(objective.endDate) ||
                        createDateInputValue(OBJECTIVE_DEFAULT_DURATION_DAYS),
                    assigneeIds: preCheckedIds,
                });
            } catch (err) {
                setError(err.response?.data?.message ?? "Failed to load objective.");
            }
        }
        loadObjective();
    }, [isEditMode, objectiveId, user?.id, isManager]);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    }

    function handleAssigneeChange(event) {
        const { value, checked } = event.target;
        setFormData((current) => {
            const ids = new Set(current.assigneeIds);
            checked ? ids.add(value) : ids.delete(value);
            return { ...current, assigneeIds: [...ids] };
        });
    }

    const selectedAssigneeNames = assignableUsers
        .filter((u) => formData.assigneeIds.includes(String(u.id)))
        .map((u) => {
            const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
            return name || u.email;
        });

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                startDate: formData.startDate,
                endDate: formData.endDate,
                assigneeIds: formData.assigneeIds.map(Number),
            };
            if (isEditMode) {
                await updateObjective(objectiveId, { ...payload, status: formData.status });
                navigate(`/objectives/${objectiveId}`);
                return;
            }
            const created = await createObjective(payload);
            navigate(created.id ? `/objectives/${created.id}` : "/objectives");
        } catch (err) {
            setError(err.response?.data?.message ?? "Failed to save objective.");
        } finally {
            setSubmitting(false);
        }
    }

    // dynamic label depending on context
    const assigneeSectionLabel = isAdmin
        ? "Assign to managers"
        : isAssignedToMe
            ? "Assign to team members"
            : "Assign to team members";

    const assigneeSectionDesc = isAdmin
        ? "Select which managers this goal belongs to."
        : isAssignedToMe
            ? "Pick which of your team members work on this."
            : "Select which of your team members can update progress.";

    // members never see the assign section
    const showAssigneeSection = isAdmin || isManager;

    return (
        <div className="card-surface max-w-3xl p-6">
            <h1 className="text-3xl font-black text-ink">
                {isEditMode ? "Edit goal" : "New goal"}
            </h1>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <ErrorAlert message={error} />
                <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Improve onboarding conversion"
                />
                <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink">Description</span>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="control-surface min-h-[120px] resize-y"
                        placeholder="Brief intent and impact."
                    />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                    <Input
                        label="Start date"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="End date"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate || createDateInputValue(0)}
                        required
                    />
                </div>
                {isEditMode && (
                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-ink">Status</span>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="control-surface"
                        >
                            {OBJECTIVE_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {showAssigneeSection && (
                    <section className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                        <div>
                            <h2 className="text-sm font-semibold text-ink">{assigneeSectionLabel}</h2>
                            <p className="mt-1 text-sm text-slate-500">{assigneeSectionDesc}</p>
                        </div>
                        {usersError ? <ErrorAlert message={usersError} /> : null}
                        {loadingUsers ? <LoadingSpinner label="Loading users..." /> : null}
                        {!loadingUsers && !usersError ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {assignableUsers.map((u) => {
                                    const uid = String(u.id);
                                    const name =
                                        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
                                        u.email;
                                    return (
                                        <label
                                            key={u.id}
                                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                value={uid}
                                                checked={formData.assigneeIds.includes(uid)}
                                                onChange={handleAssigneeChange}
                                                className="h-4 w-4 rounded border-slate-300"
                                            />
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold text-ink">
                                                    {name}
                                                </span>
                                                <span className="block truncate text-xs text-slate-500">
                                                    {u.email}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                                {!assignableUsers.length ? (
                                    <p className="text-sm text-slate-500">
                                        {isAdmin
                                            ? "No managers found."
                                            : "No team members assigned to you yet."}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                        {!loadingUsers && !usersError ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                                {isAssignedToMe ? "Assigned members: " : "Assigned: "}
                                {summarizeNames(selectedAssigneeNames)}
                            </div>
                        ) : null}
                    </section>
                )}

                <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save goal"}
                </Button>
            </form>
        </div>
    );
}
