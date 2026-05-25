import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteEntry, deleteKpi, getKpi, getKpiEntries, recordEntry } from "../../api/kpiApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Table from "../../components/common/Table";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/formatters";
import { humanizeEnum } from "../../utils/display";

export default function KpiDetailPage() {
  const navigate = useNavigate();
  const { kpiId } = useParams();
  const { accessToken } = useAuth();
  const authKey = accessToken ?? "";
  const [entryValue, setEntryValue] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entryError, setEntryError] = useState("");
  const kpiState = useFetch(() => getKpi(kpiId), [kpiId, authKey]);
  const entriesState = useFetch(() => getKpiEntries(kpiId), [kpiId, authKey]);

  async function handleRecordEntry(event) {
    event.preventDefault();
    setEntryError("");

    try {
      const createdEntry = await recordEntry(kpiId, {
        value: Number(entryValue),
        recordedAt: new Date().toISOString().slice(0, 10),
        note: entryNote.trim() || undefined
      });
      entriesState.setData((current) => [createdEntry, ...(current ?? [])]);
      setEntryValue("");
      setEntryNote("");
    } catch (error) {
      setEntryError(error.response?.data?.message ?? "Failed to record insight entry.");
    }
  }

  async function handleDeleteKpi() {
    if (!window.confirm("Delete this insight and all of its entries?")) {
      return;
    }

    try {
      await deleteKpi(kpiId);
      navigate("/insights");
    } catch (error) {
      setEntryError(error.response?.data?.message ?? "Failed to delete insight.");
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!window.confirm("Delete this insight entry?")) {
      return;
    }

    try {
      await deleteEntry(kpiId, entryId);
      entriesState.setData((current) =>
        (current ?? []).filter((entry) => entry.id !== entryId)
      );
    } catch (error) {
      setEntryError(error.response?.data?.message ?? "Failed to delete entry.");
    }
  }

  if (kpiState.loading || entriesState.loading) {
    return <LoadingSpinner label="Loading insight..." />;
  }

  if (kpiState.error || entriesState.error) {
    return <ErrorAlert message={kpiState.error || entriesState.error} />;
  }

  const kpi = kpiState.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-ink">{kpi.name}</h1>
          </div>
          <p className="mt-2 text-slate-500">{kpi.description}</p>
          <p className="mt-2 text-sm text-slate-500">
            {humanizeEnum(kpi.frequency)}
            {kpi.unit ? ` · ${kpi.unit}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={`/insights/${kpiId}/edit`}>
            <Button variant="secondary">Edit insight</Button>
          </Link>
          <Button variant="danger" onClick={handleDeleteKpi}>
            Delete insight
          </Button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-ink">Entry history</h2>
          <div className="mt-4">
            <Table
              columns={[
                { key: "value", label: "Value" },
                {
                  key: "recordedAt",
                  label: "Recorded",
                  render: (row) => formatDate(row.recordedAt ?? row.createdAt)
                },
                {
                  key: "note",
                  label: "Note",
                  render: (row) => row.note || "-"
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(row.id)}
                    >
                      Delete
                    </Button>
                  )
                }
              ]}
              rows={entriesState.data ?? []}
              emptyMessage="No insight entries recorded yet."
            />
          </div>
        </div>

        <form className="card-surface space-y-4 p-6" onSubmit={handleRecordEntry}>
          <h2 className="text-lg font-semibold text-ink">Record entry</h2>
          <ErrorAlert message={entryError} />
          <Input
            label="Value"
            type="number"
            value={entryValue}
            onChange={(event) => setEntryValue(event.target.value)}
            placeholder="Enter latest insight value"
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Note</span>
            <textarea
              value={entryNote}
              onChange={(event) => setEntryNote(event.target.value)}
              rows={4}
              className="control-surface min-h-[120px] resize-y"
              placeholder="Add context for this update."
            />
          </label>
          <Button type="submit">Save entry</Button>
        </form>
      </section>
    </div>
  );
}
