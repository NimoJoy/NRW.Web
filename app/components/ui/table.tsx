type TableProps = {
  headers: string[];
  rows: React.ReactNode[][];
  emptyMessage?: string;
};

export function Table({ headers, rows, emptyMessage = "No records found." }: TableProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] shadow-[var(--soft-shadow)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[linear-gradient(180deg,var(--surface-soft),transparent)]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[color:var(--border)]">
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={`row-${index}`} className="transition hover:bg-[color:var(--surface-soft)]">
                {row.map((cell, cellIndex) => (
                  <td key={`row-${index}-cell-${cellIndex}`} className="px-4 py-3 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-5 text-[color:var(--muted)]">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
