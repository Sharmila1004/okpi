export default function Table({ columns, rows, emptyMessage = "No records found." }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index} className="text-sm text-ink transition hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-top">
                    {column.render ? column.render(row) : row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
