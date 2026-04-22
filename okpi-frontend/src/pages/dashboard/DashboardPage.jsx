import { getKpis } from "../../api/kpiApi";
import { getObjectives } from "../../api/objectiveApi";
import ProgressBar from "../../components/charts/ProgressBar";
import StatsCard from "../../components/charts/StatsCard";
import TrendIndicator from "../../components/charts/TrendIndicator";
import ErrorAlert from "../../components/common/ErrorAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";
import { useFetch } from "../../hooks/useFetch";

export default function DashboardPage() {
  const objectivesState = useFetch(getObjectives, []);
  const kpisState = useFetch(getKpis, []);

  if (objectivesState.loading || kpisState.loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  if (objectivesState.error || kpisState.error) {
    return <ErrorAlert message={objectivesState.error || kpisState.error} />;
  }

  const objectives = objectivesState.data ?? [];
  const kpis = kpisState.data ?? [];
  const completedObjectives = objectives.filter(
    (objective) => objective.status === "COMPLETED"
  ).length;
  const averageObjectiveProgress = objectives.length
    ? Math.round(
        objectives.reduce(
          (total, objective) => total + Number(objective.progress ?? 0),
          0
        ) / objectives.length
      )
    : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatsCard
          label="Objectives"
          value={objectives.length}
          helper={`${completedObjectives} completed`}
        />
        <StatsCard label="KPIs" value={kpis.length} helper="Current user scope" />
        <StatsCard
          label="Average progress"
          value={`${averageObjectiveProgress}%`}
          helper="Across all objectives"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Objective momentum</h2>
            <TrendIndicator value={12} />
          </div>
          <div className="space-y-4">
            {objectives.slice(0, 5).map((objective) => (
              <div key={objective.id} className="space-y-2 rounded-2xl bg-sand/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-ink">{objective.title}</div>
                  <StatusBadge status={objective.status} />
                </div>
                <ProgressBar value={objective.progress} />
              </div>
            ))}
            {!objectives.length ? (
              <p className="text-sm text-slate-500">No objectives available yet.</p>
            ) : null}
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-ink">KPI watchlist</h2>
          <div className="mt-4 space-y-4">
            {kpis.slice(0, 5).map((kpi) => (
              <div
                key={kpi.id}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4"
              >
                <div>
                  <div className="font-semibold text-ink">{kpi.name}</div>
                  <div className="text-sm text-slate-500">
                    {kpi.frequency} {kpi.unit ? `· ${kpi.unit}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-ink">{kpi.frequency}</div>
                  <div className="text-sm text-slate-500">{kpi.unit ?? "No unit"}</div>
                </div>
              </div>
            ))}
            {!kpis.length ? (
              <p className="text-sm text-slate-500">No KPI data available yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
