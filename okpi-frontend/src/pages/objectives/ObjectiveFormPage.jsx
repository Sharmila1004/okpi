import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createObjective,
  getObjective,
  updateObjective
} from "../../api/objectiveApi";
import { getUsers } from "../../api/authApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { OBJECTIVE_STATUSES } from "../../utils/constants";

const OBJECTIVE_DEFAULT_DURATION_DAYS = 30;

function formatDateInput(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateInput(date);
}

function createInitialForm() {
  return {
    title: "",
    description: "",
    status: "DRAFT",
    startDate: createDateInputValue(0),
    endDate: createDateInputValue(OBJECTIVE_DEFAULT_DURATION_DAYS),
    assigneeIds: []
  };
}

function summarizeNames(names, limit = 3, emptyLabel = "None") {
  const filteredNames = names.filter(Boolean);

  if (!filteredNames.length) {
    return emptyLabel;
  }

  if (filteredNames.length <= limit) {
    return filteredNames.join(", ");
  }

  return `${filteredNames.slice(0, limit).join(", ")} +${filteredNames.length - limit} more`;
}

export default function ObjectiveFormPage() {
  const navigate = useNavigate();
  const { objectiveId } = useParams();
  const isEditMode = Boolean(objectiveId);
  const [formData, setFormData] = useState(() => createInitialForm());
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState(false);
  const [usersErrorMessage, setUsersErrorMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await getUsers({ page: 0, size: 1000 });
        setUsers(response.content ?? []);
        setUsersError(false);
        setUsersErrorMessage("");
      } catch (loadError) {
        setUsersError(true);
        setUsersErrorMessage(loadError.response?.data?.message ?? "Failed to load users.");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    async function loadObjective() {
      try {
        const objective = await getObjective(objectiveId);
        setFormData({
          title: objective.title ?? "",
          description: objective.description ?? "",
          status: objective.status ?? "DRAFT",
          startDate: formatDateInput(objective.startDate) || createDateInputValue(0),
          endDate:
              formatDateInput(objective.endDate) ||
              createDateInputValue(OBJECTIVE_DEFAULT_DURATION_DAYS),
          assigneeIds: (objective.assigneeIds ?? []).map(String)
        });
      } catch (loadError) {
        setError(loadError.response?.data?.message ?? "Failed to load objective.");
      }
    }

    loadObjective();
  }, [isEditMode, objectiveId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleAssigneeChange(event) {
    const { value, checked } = event.target;
    setFormData((current) => {
      const assigneeIds = new Set(current.assigneeIds);
      if (checked) {
        assigneeIds.add(value);
      } else {
        assigneeIds.delete(value);
      }
      return { ...current, assigneeIds: [...assigneeIds] };
    });
  }

  const selectedAssigneeNames = users
      .filter((user) => formData.assigneeIds.includes(String(user.id)))
      .map((user) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
        return name || user.email;
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
        assigneeIds: formData.assigneeIds.map(Number)
      };

      if (isEditMode) {
        await updateObjective(objectiveId, {
          ...payload,
          status: formData.status
        });
        navigate(`/objectives/${objectiveId}`);
        return;
      }

      const createdObjective = await createObjective(payload);
      navigate(createdObjective.id ? `/objectives/${createdObjective.id}` : "/objectives");
    } catch (submitError) {
      setError(submitError.response?.data?.message ?? "Failed to save objective.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
      <div className="card-surface max-w-3xl p-6">
        <h1 className="text-3xl font-black text-ink">
          {isEditMode ? "Edit goal" : "New goal"}
        </h1>
        <p className="mt-2 text-slate-500">
          Create or edit goals.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="eg. Improve onboarding conversion"
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
          {isEditMode ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Status</span>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="control-surface"
                >
                  {OBJECTIVE_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                  ))}
                </select>
              </label>
          ) : null}
          <section className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">People</h2>
              <p className="mt-1 text-sm text-slate-500">
                People who can update progress.
              </p>
            </div>
            {usersError ? <ErrorAlert message={usersErrorMessage || "Failed to load users."} /> : null}
            {loadingUsers ? <LoadingSpinner label="Loading users..." /> : null}
            {!loadingUsers && !usersError ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {users.map((user) => {
                    const userId = String(user.id);
                    const name =
                        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
                        user.email;
                    return (
                        <label
                            key={user.id}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <input
                              type="checkbox"
                              value={userId}
                              checked={formData.assigneeIds.includes(userId)}
                              onChange={handleAssigneeChange}
                              className="h-4 w-4 rounded border-slate-300"
                          />
                          <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {user.email}
                      </span>
                    </span>
                        </label>
                    );
                  })}
                  {!users.length ? (
                      <p className="text-sm text-slate-500">No users available.</p>
                  ) : null}
                </div>
            ) : null}
            {!loadingUsers && !usersError ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                  Assigned: {summarizeNames(selectedAssigneeNames, 4, "No assignees selected")}
                </div>
            ) : null}
          </section>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save goal"}
          </Button>
        </form>
      </div>
  );
}
