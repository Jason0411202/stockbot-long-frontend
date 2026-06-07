import type { ReactNode } from "react";

import styles from "./DataTable.module.css";

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  /** 數字欄：套用等寬 tabular 字體並預設右對齊 */
  numeric?: boolean;
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  rowKey: (row: T, index: number) => string;
  caption?: string;
}

/** 通用型別化資料表：sticky header、數字欄等寬右對齊、hover 高亮。 */
export function DataTable<T>({ columns, rows, rowKey, caption }: DataTableProps<T>) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                data-align={col.align ?? (col.numeric ? "right" : "left")}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  data-align={col.align ?? (col.numeric ? "right" : "left")}
                  className={col.numeric ? "num" : undefined}
                >
                  {col.render(row, index) as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
