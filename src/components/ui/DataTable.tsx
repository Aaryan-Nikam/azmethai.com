import React from 'react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string | number }>({ data, columns, onRowClick }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-[#050505]">
      <table className="w-full text-left text-xs align-middle">
        <thead className="bg-[#111111] border-b border-white/5">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)]" style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row) => (
            <tr 
              key={row.id}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
            >
              {columns.map((col, i) => (
                <td key={i} className="px-4 py-3 text-[var(--text-primary)]">
                  {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey]) : '')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
             <tr>
               <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--text-muted)] font-mono">
                 No records found.
               </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
