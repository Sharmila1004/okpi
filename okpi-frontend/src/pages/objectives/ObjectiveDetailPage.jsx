import { Link, useParams } from "react-router-dom";
import { getObjective, getKeyResults } from "../../api/objectiveApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";
import Table from "../../components/common/Table";
import { useFetch } from "../../hooks/useFetch";

export default function ObjectiveDetailPage() {
  const { objectiveId } = useParams();
  const objectiveState = useFetch(() => getObjective(objectiveId), [objectiveId]);
  const keyResultsState = useFetch(() => getKeyResults(objectiveId), [objectiveId]);

  if (objectiveState.loading || keyResultsState.loading) {
    return <LoadingSpinner label="Loading objective..." />;
  }

  if (objectiveState.error || keyResultsState.error) {
    return <ErrorAlert message={objectiveState.error || keyResultsState.error} />;
  }

  const objective = objectiveState.data;
  const keyResults = keyResultsState.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-ink">{objective.title}</h1>
            <StatusBadge status={objective.status} />
          </div>
          <p className="mt-2 text-slate-500">{objective.description}</p>
        </div>
        <Link to={`/objectives/${objectiveId}/edit`}>
          <Button variant="secondary">Edit objective</Button>
        </Link>
      </div>

      <section className="card-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Key results</h2>
        <div className="mt-4">
          <Table
            columns={[
              { key: "title", label: "Title" },
              { key: "metricType", label: "Metric" },
              { key: "targetValue", label: "Target" },
              { key: "currentValue", label: "Current" }
            ]}
            rows={keyResults}
            emptyMessage="No key results defined for this objective."
          />
        </div>
      </section>
    </div>
  );
}
