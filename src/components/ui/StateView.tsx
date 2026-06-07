import type { ReactNode } from "react";

import { ApiError } from "@/lib/api/client";
import { MessageState, TableSkeleton } from "./feedback";

interface StateViewProps<T> {
  isLoading: boolean;
  error: unknown;
  data: readonly T[] | undefined;
  /** 載入時顯示的內容（預設為表格骨架） */
  loading?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  children: (data: readonly T[]) => ReactNode;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "發生未知錯誤";
}

/**
 * 統一處理「載入 / 錯誤 / 空 / 有資料」四種狀態的渲染，避免每頁重複。
 * 有資料時透過 render-prop 把 data 交給呼叫端。
 */
export function StateView<T>({
  isLoading,
  error,
  data,
  loading,
  emptyTitle = "目前沒有資料",
  emptyDescription,
  children,
}: StateViewProps<T>) {
  if (isLoading) return <>{loading ?? <TableSkeleton />}</>;

  if (error) {
    return (
      <MessageState
        tone="error"
        title="無法載入資料"
        description={
          <>
            {errorMessage(error)}
            <br />
            請確認後端服務已啟動，且 NEXT_PUBLIC_BACKEND_URL 設定正確。
          </>
        }
      />
    );
  }

  if (!data || data.length === 0) {
    return <MessageState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children(data)}</>;
}
