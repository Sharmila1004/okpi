import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUsersSummary } from "../../api/authApi";
import {
  createKeyResult,
  deleteKeyResult,
  deleteObjective,
  getKeyResults,
  getObjective,
  updateKeyResult
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
  status: "NOT_STARTED"
};

function toNumberOrUndefined(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getDisplayName(user, fallbackLabel = "User") {
  if (!user) {
    return fallbackLabel;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || fallbackLabel;
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

function buildUserDirectory(users = []) {
  return new Map(
    users
      .filter((user) => user?.id != null)
      .map((user) => [String(user.id), user])
  );
}

function resolveUserName(userDirectory, userId, fallbackRole = "User") {
  if (userId == null) {
    return fallbackRole;
  }

  const user = userDirectory.get(String(userId));
  return getDisplayName(user, `${fallbackRole} #${userId}`);
}

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
      [...new Set((objective?.assigneeIds ?? [])
        .map((assigneeId) => Number(assigneeId))
        .filter((assigneeId) => Number.isFinite(assigneeId)))],
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
  const assigneeNames = assigneeIds.map((assigneeId) =>
    resolveUserName(assigneeDirectory, assigneeId, "Member")
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
      status: keyResult.status ?? "NOT_STARTED"
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
    if (!window.confirm("Delete this objective?")) {
      return;
    }

    try {
      await deleteObjective(objectiveId);
      navigate("/objectives");
    } catch (error) {
      setObjectiveError(error.response?.data?.message ?? "Failed to delete objective.");
    }
  }

  async function handleDeleteKeyResult(keyResultId) {
    if (!window.confirm("Delete this key result?")) {
      return;
    }

    try {
      await deleteKeyResult(objectiveId, keyResultId);
      const prevKeyResults = keyResultsState.data ?? [];
      const updatedKeyResults = prevKeyResults.filter((keyResult) => keyResult.id !== keyResultId);
      keyResultsState.setData(updatedKeyResults);

      // optimistic compute & rehydrate objective
      try {
        const computedProgress = computeObjectiveProgress(updatedKeyResults);
        objectiveState.setData((current) => ({ ...(current ?? {}), progress: computedProgress }));
      } catch (e) {}

      try {
        const freshObjective = await getObjective(objectiveId);
        objectiveState.setData(freshObjective);
        window.dispatchEvent(new CustomEvent("okpi:objective-updated", { detail: { objectiveId, objective: freshObjective } }));
      } catch (e) {}
    } catch (error) {
      setKeyResultError(error.response?.data?.message ?? "Failed to delete key result.");
    }
  }

  async function handleKeyResultSubmit(event) {
    event.preventDefault();
    setSavingKeyResult(true);
    setKeyResultError("");

    const payload = editingKeyResult && !canManageObjectives
      ? {
          currentValue: toNumberOrUndefined(keyResultForm.currentValue),
          status: keyResultForm.status
        }
      : editingKeyResult
      ? {
          title: keyResultForm.title.trim(),
          description: keyResultForm.description.trim(),
          currentValue: toNumberOrUndefined(keyResultForm.currentValue),
          targetValue: toNumberOrUndefined(keyResultForm.targetValue),
          status: keyResultForm.status
        }
      : {
          title: keyResultForm.title.trim(),
          description: keyResultForm.description.trim(),
          metricType: keyResultForm.metricType,
          startValue: toNumberOrUndefined(keyResultForm.startValue),
          targetValue: toNumberOrUndefined(keyResultForm.targetValue)
        };

    try {
      const savedKeyResult = editingKeyResult
        ? await updateKeyResult(objectiveId, editingKeyResult.id, payload)
        : await createKeyResult(objectiveId, payload);

      // deterministic update of key results list
      const prevKeyResults = keyResultsState.data ?? [];
      const updatedKeyResults = editingKeyResult
        ? prevKeyResults.map((item) => (item.id === savedKeyResult.id ? savedKeyResult : item))
        : [savedKeyResult, ...prevKeyResults];

      keyResultsState.setData(updatedKeyResults);

      // optimistic compute progress locally
      try {
        const computedProgress = computeObjectiveProgress(updatedKeyResults);
        objectiveState.setData((current) => ({ ...(current ?? {}), progress: computedProgress }));
      } catch (e) {
        // ignore
      }

      // rehydrate objective from server for authoritative values and notify listeners
      try {
        const freshObjective = await getObjective(objectiveId);
        objectiveState.setData(freshObjective);
        window.dispatchEvent(
          new CustomEvent("okpi:objective-updated", { detail: { objectiveId, objective: freshObjective } })
        );
      } catch (e) {
        // ignore
      }

      closeKeyResultModal();
    } catch (error) {
      setKeyResultError(error.response?.data?.message ?? "Failed to save key result.");
    } finally {
      setSavingKeyResult(false);
    }
  }

  if (objectiveState.loading || keyResultsState.loading) {
    return <LoadingSpinner label="Loading goal..." />;
  }

  if (objectiveState.error || keyResultsState.error) {
    return <ErrorAlert message={objectiveState.error || keyResultsState.error} />;
  }

  if (!objective) {
    return <ErrorAlert message="Goal not found." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-ink">{objective.title}</h1>
            <StatusBadge status={objective.status} />
          </div>
          <p className="mt-2 text-slate-500">{objective.description}</p>
          <div className="mt-2 space-y-2 text-sm text-slate-500">
            <p>
              Start {formatDate(objective.startDate)} · Due {formatDate(objective.endDate)}
            </p>
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

      <section className="card-surface p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Key results</h2>
            <p className="mt-1 text-sm text-slate-500">
              Track performance against targets
            </p>
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
                  </div>
                )
              },
              {
                key: "metricType",
                label: "Metric",
                render: (row) => humanizeEnum(row.metricType)
              },
              {
                key: "startValue",
                label: "Start",
                render: (row) => formatNumber(row.startValue)
              },
              {
                key: "targetValue",
                label: "Target",
                render: (row) => formatNumber(row.targetValue)
              },
              {
                key: "currentValue",
                label: "Current",
                render: (row) => formatNumber(row.currentValue)
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusBadge status={row.status} />
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
                    )
                  }
                : null
            ].filter(Boolean)}
            rows={keyResults}
            emptyMessage="No key results for this goal."
          />
        </div>
      </section>

      <Modal
        title={progressOnlyMode ? "Update progress" : editingKeyResult ? "Edit key result" : "New key result"}
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
                onChange={(event) =>
                  setKeyResultForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Reduce onboarding drop-off"
                required
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Description</span>
                <textarea
                  value={keyResultForm.description}
                  onChange={(event) =>
                    setKeyResultForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
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
                onChange={(event) =>
                  setKeyResultForm((current) => ({
                    ...current,
                    currentValue: event.target.value
                  }))
                }
                placeholder="0"
              />
              {!progressOnlyMode ? (
                <Input
                  label="Target value"
                  type="number"
                  value={keyResultForm.targetValue}
                  onChange={(event) =>
                    setKeyResultForm((current) => ({
                      ...current,
                      targetValue: event.target.value
                    }))
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
                  onChange={(event) =>
                    setKeyResultForm((current) => ({
                      ...current,
                      metricType: event.target.value
                    }))
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
                onChange={(event) =>
                  setKeyResultForm((current) => ({
                    ...current,
                    startValue: event.target.value
                  }))
                }
                placeholder="0"
              />
              <Input
                label="Target value"
                type="number"
                value={keyResultForm.targetValue}
                onChange={(event) =>
                  setKeyResultForm((current) => ({
                    ...current,
                    targetValue: event.target.value
                  }))
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
                onChange={(event) =>
                  setKeyResultForm((current) => ({
                    ...current,
                    status: event.target.value
                  }))
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
