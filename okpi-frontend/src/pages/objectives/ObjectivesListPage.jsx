import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getObjectives } from "../../api/objectiveApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import Table from "../../components/common/Table";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { useFetch } from "../../hooks/useFetch";
import { isManagerOrAdmin } from "../../utils/display";

const PAGE_SIZE = 5;

export default function ObjectivesListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const canCreateObjectives = isManagerOrAdmin(user?.role);
  const debouncedSearch = useDebounce(search);
  const objectivesFetch = useFetch(getObjectives, []);
  const { data, loading, error, setData } = objectivesFetch;

  useEffect(() => {
    function handler() {
      getObjectives()
        .then((objs) => setData(objs))
        .catch(() => {});
    }
    window.addEventListener("okpi:objective-updated", handler);
    return () => window.removeEventListener("okpi:objective-updated", handler);
  }, [setData]);

  const filteredObjectives = useMemo(() => {
    const objectives = data ?? [];
    if (!debouncedSearch) {
      return objectives;
    }

    return objectives.filter((objective) =>
      `${objective.title} ${objective.description}`
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase())
    );
  }, [data, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredObjectives.length / PAGE_SIZE));
  const pagedObjectives = filteredObjectives.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-ink">Objectives</h1>
          <p className="text-slate-500">Create, inspect, and refine strategic goals.</p>
        </div>
        {canCreateObjectives ? (
          <Link to="/objectives/new">
            <Button>New objective</Button>
          </Link>
        ) : (
          <p className="text-sm text-slate-500">
            Managers and admins can create new objectives.
          </p>
        )}
      </div>

      <div className="card-surface p-4">
        <Input
          label="Search objectives"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by title or description"
        />
      </div>

      {loading ? <LoadingSpinner label="Loading objectives..." /> : null}
      <ErrorAlert message={error} />
      {!loading ? (
        <Table
          columns={[
            {
              key: "title",
              label: "Objective",
              render: (row) => (
                <Link className="font-semibold text-ink" to={`/objectives/${row.id}`}>
                  {row.title}
                </Link>
              )
            },
            { key: "description", label: "Description" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge status={row.status} />
            },
            { key: "progress", label: "Progress" }
          ]}
          rows={pagedObjectives}
        />
      ) : null}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
