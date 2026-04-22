export default function Table({ columns, rows, emptyMessage = "No records found." }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <table className="min-w-full divide-y divide-black/5 text-left">
        <thead className="bg-sand/70">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index} className="text-sm text-ink">
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
