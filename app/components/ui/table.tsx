type TableProps = {
  headers: string[];
  rows: React.ReactNode[][];
  emptyMessage?: string;
};

export function Table({ headers, rows, emptyMessage = "No records found." }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-black/10">
      <table className="min-w-full divide-y divide-black/10 text-left text-sm">
        <thead className="bg-foreground/[0.04]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold text-foreground/80">
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-black/10">
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={`row-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`row-${index}-cell-${cellIndex}`} className="px-3 py-2 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-foreground/60">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
