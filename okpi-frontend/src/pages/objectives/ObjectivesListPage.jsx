import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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

const PAGE_SIZE = 10;

const FILTER_LABELS = {
  on_track: "On track",
  attention: "Needs attention",
};

export default function ObjectivesListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const canCreateObjectives = isManagerOrAdmin(user?.role);
  const debouncedSearch = useDebounce(search);
  const objectivesFetch = useFetch(getObjectives, []);
  const { data, loading, error, setData } = objectivesFetch;

  const location = useLocation();
  const filterParam = new URLSearchParams(location.search).get("filter") ?? "";

  // Reset to page 1 whenever the filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filterParam, debouncedSearch]);

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
    let result = data ?? [];

    if (debouncedSearch) {
      result = result.filter((o) =>
          `${o.title} ${o.description}`
              .toLowerCase()
              .includes(debouncedSearch.toLowerCase())
      );
    }

    if (filterParam === "on_track") {
      result = result.filter(
          (o) => o.status === "ON_TRACK" || o.status === "COMPLETED"
      );
    } else if (filterParam === "attention") {
      result = result.filter(
          (o) => o.status === "AT_RISK" || o.status === "OFF_TRACK"
      );
    }

    return result;
  }, [data, debouncedSearch, filterParam]);

  const totalPages = Math.max(1, Math.ceil(filteredObjectives.length / PAGE_SIZE));
  const pagedObjectives = filteredObjectives.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
  );

  const filterLabel = FILTER_LABELS[filterParam];

  return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-ink">Goals</h1>
            {filterLabel ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Filtered: {filterLabel} &mdash;{" "}
                  <Link to="/objectives" className="underline hover:text-ink">
                    Clear filter
                  </Link>
                </p>
            ) : (
                <p className="text-slate-500">Create, inspect, and refine goals.</p>
            )}
          </div>
          {canCreateObjectives ? (
              <Link to="/objectives/new">
                <Button>New goal</Button>
              </Link>
          ) : (
              <p className="text-sm text-slate-500">
                Managers and admins can create goals.
              </p>
          )}
        </div>

        <div className="card-surface p-4">
          <Input
              label="Search goals"
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
                    label: "Goal",
                    render: (row) => (
                        <Link
                            className="font-semibold text-ink"
                            to={`/objectives/${row.id}`}
                        >
                          {row.title}
                        </Link>
                    ),
                  },
                  { key: "description", label: "Description" },
                  {
                    key: "status",
                    label: "Status",
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    key: "progress",
                    label: "Progress",
                    render: (row) => `${Math.round(Number(row.progress ?? row.progressPercentage ?? 0))}%`,
                  },
                ]}
                rows={pagedObjectives}
                emptyMessage={
                  filterLabel
                      ? `No goals match the "${filterLabel}" filter.`
                      : "No goals found."
                }
            />
        ) : null}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
  );
}
