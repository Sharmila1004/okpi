import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createKpi, getKpi, updateKpi } from "../../api/kpiApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";

const initialForm = {
  name: "",
  description: "",
  unit: "",
  frequency: "MONTHLY"
};

export default function KpiFormPage() {
  const navigate = useNavigate();
  const { kpiId } = useParams();
  const isEditMode = Boolean(kpiId);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    async function loadKpi() {
      try {
        const kpi = await getKpi(kpiId);
        setFormData({
          name: kpi.name ?? "",
          description: kpi.description ?? "",
          unit: kpi.unit ?? "",
          frequency: kpi.frequency ?? "MONTHLY"
        });
      } catch (loadError) {
        setError(loadError.response?.data?.message ?? "Failed to load KPI.");
      }
    }

    loadKpi();
  }, [isEditMode, kpiId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = { ...formData };

    try {
      if (isEditMode) {
        await updateKpi(kpiId, payload);
        navigate(`/kpis/${kpiId}`);
        return;
      }

      const createdKpi = await createKpi(payload);
      navigate(createdKpi.id ? `/kpis/${createdKpi.id}` : "/kpis");
    } catch (submitError) {
      setError(submitError.response?.data?.message ?? "Failed to save KPI.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card-surface max-w-3xl p-6">
      <h1 className="text-3xl font-black text-ink">
        {isEditMode ? "Edit KPI" : "Create KPI"}
      </h1>
      <p className="mt-2 text-slate-500">Set measurable indicators and target values.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <ErrorAlert message={error} />
        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Monthly revenue retention"
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Description</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-moss"
            placeholder="Describe how this KPI should be interpreted."
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Frequency</span>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-moss"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </label>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save KPI"}
        </Button>
      </form>
    </div>
  );
}
