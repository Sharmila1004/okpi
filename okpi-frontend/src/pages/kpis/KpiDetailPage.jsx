import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getKpi, getKpiEntries, recordEntry } from "../../api/kpiApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Table from "../../components/common/Table";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/formatters";

export default function KpiDetailPage() {
  const { kpiId } = useParams();
  const [entryValue, setEntryValue] = useState("");
  const [entryError, setEntryError] = useState("");
  const kpiState = useFetch(() => getKpi(kpiId), [kpiId]);
  const entriesState = useFetch(() => getKpiEntries(kpiId), [kpiId]);

  async function handleRecordEntry(event) {
    event.preventDefault();
    setEntryError("");

    try {
      const createdEntry = await recordEntry(kpiId, {
        value: Number(entryValue),
        recordedAt: new Date().toISOString()
      });
      entriesState.setData((current) => [createdEntry, ...(current ?? [])]);
      setEntryValue("");
    } catch (error) {
      setEntryError(error.response?.data?.message ?? "Failed to record KPI entry.");
    }
  }

  if (kpiState.loading || entriesState.loading) {
    return <LoadingSpinner label="Loading KPI..." />;
  }

  if (kpiState.error || entriesState.error) {
    return <ErrorAlert message={kpiState.error || entriesState.error} />;
  }

  const kpi = kpiState.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-ink">{kpi.name}</h1>
          <p className="mt-2 text-slate-500">{kpi.description}</p>
        </div>
        <Link to={`/kpis/${kpiId}/edit`}>
          <Button variant="secondary">Edit KPI</Button>
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-ink">Entries</h2>
          <div className="mt-4">
            <Table
              columns={[
                { key: "value", label: "Value" },
                {
                  key: "createdAt",
                  label: "Recorded",
                  render: (row) => formatDate(row.recordedAt ?? row.createdAt)
                }
              ]}
              rows={entriesState.data ?? []}
              emptyMessage="No KPI entries recorded yet."
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
            placeholder="Enter latest KPI value"
          />
          <Button type="submit">Save entry</Button>
        </form>
      </section>
    </div>
  );
}
