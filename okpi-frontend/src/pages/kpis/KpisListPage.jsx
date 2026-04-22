import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getKpis } from "../../api/kpiApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";
import Table from "../../components/common/Table";
import { useDebounce } from "../../hooks/useDebounce";
import { useFetch } from "../../hooks/useFetch";

const PAGE_SIZE = 5;

export default function KpisListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const { data, loading, error } = useFetch(getKpis, []);

  const filteredKpis = useMemo(() => {
    const kpis = data ?? [];
    if (!debouncedSearch) {
      return kpis;
    }

    return kpis.filter((kpi) =>
      `${kpi.name} ${kpi.description}`.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [data, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredKpis.length / PAGE_SIZE));
  const pagedKpis = filteredKpis.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-ink">KPIs</h1>
          <p className="text-slate-500">Track measurable indicators and recent entries.</p>
        </div>
        <Link to="/kpis/new">
          <Button>New KPI</Button>
        </Link>
      </div>

      <div className="card-surface p-4">
        <Input
          label="Search KPIs"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by KPI name or description"
        />
      </div>

      {loading ? <LoadingSpinner label="Loading KPIs..." /> : null}
      <ErrorAlert message={error} />
      {!loading ? (
        <Table
          columns={[
            {
              key: "name",
              label: "Name",
              render: (row) => (
                <Link className="font-semibold text-ink" to={`/kpis/${row.id}`}>
                  {row.name}
                </Link>
              )
            },
            { key: "description", label: "Description" },
            { key: "frequency", label: "Frequency" },
            { key: "unit", label: "Unit" }
          ]}
          rows={pagedKpis}
        />
      ) : null}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
