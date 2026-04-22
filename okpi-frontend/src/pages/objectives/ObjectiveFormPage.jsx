import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createObjective,
  getObjective,
  updateObjective
} from "../../api/objectiveApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import { OBJECTIVE_STATUSES } from "../../utils/constants";

const OBJECTIVE_DEFAULT_DURATION_DAYS = 30;

function formatDateInput(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

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
    endDate: createDateInputValue(OBJECTIVE_DEFAULT_DURATION_DAYS)
  };
}

export default function ObjectiveFormPage() {
  const navigate = useNavigate();
  const { objectiveId } = useParams();
  const isEditMode = Boolean(objectiveId);
  const [formData, setFormData] = useState(() => createInitialForm());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

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
            createDateInputValue(OBJECTIVE_DEFAULT_DURATION_DAYS)
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

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate
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
        {isEditMode ? "Edit objective" : "Create objective"}
      </h1>
      <p className="mt-2 text-slate-500">
        Use a single shared form for create and edit flows.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <ErrorAlert message={error} />
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Improve onboarding conversion"
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Description</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-moss"
            placeholder="Explain the strategic intent and expected business impact."
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Start date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            min={createDateInputValue(0)}
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
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-moss"
            >
              {OBJECTIVE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save objective"}
        </Button>
      </form>
    </div>
  );
}
