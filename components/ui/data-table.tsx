"use client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react"

/** Default: header row ~h-10 + padded body row. */
export const DATA_TABLE_HEADER_REM = 2.5
export const DATA_TABLE_BODY_ROW_REM = 2.8125

/** Compact tables: shorter header + tighter body row (staking history). */
export const DATA_TABLE_HEADER_REM_COMPACT = 1.75
export const DATA_TABLE_BODY_ROW_REM_COMPACT = 1.625

/** Compact table at `sm+` (desktop history): roomier rows + body text ~13px. */
export const DATA_TABLE_HEADER_REM_COMPACT_SM = 2
export const DATA_TABLE_BODY_ROW_REM_COMPACT_SM = 1.875

/** Pass on `ColumnDef` as `meta` (TanStack Table). */
export type DataTableColumnMeta = {
  /**
   * Compact mode: avoid `max-w-0` and inner `overflow-hidden` so full strings
   * (e.g. long locale dates) stay visible; sets a minimum column width under `table-fixed`.
   */
  compactNoClip?: boolean
  /** Compact `showBodySkeleton`: `className` passed to `Skeleton` in the loading body row. */
  skeletonClassName?: string
  /** Horizontal alignment of the skeleton row cell inner flex (default `start`). */
  skeletonCellJustify?: "start" | "center" | "end"
}

function readDataTableColumnMeta(meta: unknown): DataTableColumnMeta {
  if (meta && typeof meta === "object") return meta as DataTableColumnMeta
  return {}
}

/** Tailwind `min-w-50` (12.5rem); compact no-clip columns (e.g. full locale dates). */
export const DATA_TABLE_COMPACT_NO_CLIP_MIN_WIDTH_CLASS = "min-w-50"

/** Horizontal inset between columns under `border-collapse` (replaces old `border-spacing-x`). */
export const DATA_TABLE_COMPACT_CELL_X_PADDING = "px-1.5 md:px-2"

const COMPACT_CLIP_CELL = cn(
  "max-w-0 py-0 align-middle whitespace-nowrap",
  DATA_TABLE_COMPACT_CELL_X_PADDING
)
const COMPACT_NO_CLIP_CELL = cn(
  DATA_TABLE_COMPACT_NO_CLIP_MIN_WIDTH_CLASS,
  "max-w-none py-0 align-middle whitespace-nowrap",
  DATA_TABLE_COMPACT_CELL_X_PADDING
)
const COMPACT_NO_CLIP_HEAD = DATA_TABLE_COMPACT_NO_CLIP_MIN_WIDTH_CLASS

/** Stable default — avoid a new `[]` each render (subtree churn under Radix Select). */
const DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS: number[] = [10, 20, 50]

type DataTablePageSizeSelectProps = {
  value: string
  pageSizeOptions: readonly number[] | number[]
  onValueChange: (value: string) => void
}

const DataTablePageSizeSelect = memo(function DataTablePageSizeSelect({
  value,
  pageSizeOptions,
  onValueChange,
}: DataTablePageSizeSelectProps) {
  const items = useMemo(
    () =>
      pageSizeOptions.map(size => (
        <SelectItem key={size} value={String(size)}>
          {size}
        </SelectItem>
      )),
    [pageSizeOptions],
  )

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className="h-8 w-18">
        <SelectValue />
      </SelectTrigger>
      <SelectContent side="top">{items}</SelectContent>
    </Select>
  )
})

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  getRowId?: (originalRow: TData, index: number, parent?: unknown) => string
  initialSorting?: SortingState
  pageSizeOptions?: number[]
  defaultPageSize?: number
  className?: string
  emptyMessage?: string
  embedded?: boolean
  compactEmpty?: boolean
  /**
   * Tighter row padding, smaller row/header rem (staking history).
   */
  compact?: boolean
  /**
   * All rows in `data` render; no pagination footer. Use with sliced data + `onNearScrollEnd`.
   */
  hidePagination?: boolean
  /**
   * Cap scroll viewport: at least `viewportMinBodyRows` and at most `viewportMaxBodyRows` body rows tall.
   * When `viewportMaxBodyRows` is set, the same min/max height contract applies even with zero rows
   * (empty / search-empty), so the scroll shell does not collapse.
   */
  viewportMinBodyRows?: number
  viewportMaxBodyRows?: number
  /**
   * @deprecated Prefer `viewportMinBodyRows` / `viewportMaxBodyRows`. If set without viewport max, keeps legacy height math.
   */
  maxBodyRowsBeforeScroll?: number
  maxViewportBodyRows?: number
  bodyRowRem?: number
  collapsePaginationWhenSinglePage?: boolean
  /** When near bottom of scroll area and `canLoadMore`, called once per settle (client infinite slice). */
  onNearScrollEnd?: () => void
  canLoadMore?: boolean
  /** Merged onto `<table>` (e.g. `table-fixed` + column widths for no horizontal scroll). */
  tableClassName?: string
  /**
   * Renders skeleton body rows inside the same table shell (no subtree swap).
   * Intended with `data={[]}`, `compact`, and capped viewport props.
   */
  showBodySkeleton?: boolean
  /** Body skeleton rows when `showBodySkeleton` (defaults to `viewportMinBodyRows` or 3). */
  bodySkeletonRowCount?: number
  /**
   * When the capped viewport empty state is shown, render this instead of plain `emptyMessage`
   * (e.g. card + icon to match mobile empty UI).
   */
  renderCappedViewportEmpty?: (message: string) => ReactNode
  /** Optional: vertical scroll viewport (capped body shell) for scroll preservation / diagnostics. */
  viewportScrollRef?: Ref<HTMLDivElement | null>
}

function assignViewportScrollRef(
  inner: { current: HTMLDivElement | null },
  outer: Ref<HTMLDivElement | null> | undefined,
  node: HTMLDivElement | null
): void {
  inner.current = node
  if (outer == null) return
  if (typeof outer === "function") {
    outer(node)
    return
  }
  ;(outer as { current: HTMLDivElement | null }).current = node
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  initialSorting = [],
  pageSizeOptions = DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS,
  defaultPageSize = 10,
  className,
  emptyMessage = "No results.",
  embedded = false,
  compactEmpty = false,
  compact = false,
  hidePagination = false,
  viewportMinBodyRows,
  viewportMaxBodyRows,
  maxBodyRowsBeforeScroll,
  maxViewportBodyRows,
  bodyRowRem: bodyRowRemProp,
  collapsePaginationWhenSinglePage = false,
  onNearScrollEnd,
  canLoadMore = false,
  tableClassName,
  showBodySkeleton = false,
  bodySkeletonRowCount,
  renderCappedViewportEmpty,
  viewportScrollRef,
}: DataTableProps<TData, TValue>) {
  const headerRem = compact ? DATA_TABLE_HEADER_REM_COMPACT : DATA_TABLE_HEADER_REM
  const defaultBodyRowRem = compact
    ? DATA_TABLE_BODY_ROW_REM_COMPACT
    : DATA_TABLE_BODY_ROW_REM
  const bodyRowRem = bodyRowRemProp ?? defaultBodyRowRem

  /** Viewport height math uses desktop compact sizing when `compact` (table shown sm+ on staking). */
  const viewportHeaderRem = compact ? DATA_TABLE_HEADER_REM_COMPACT_SM : headerRem
  const viewportBodyRem = compact ? DATA_TABLE_BODY_ROW_REM_COMPACT_SM : bodyRowRem

  const [sorting, setSorting] = useState<SortingState>(
    initialSorting.length > 0
      ? initialSorting
      : [{ id: "timestamp", desc: true }]
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const table = useReactTable({
    data,
    columns,
    getRowId,
    enableSorting: !hidePagination,
    onSortingChange: setSorting,
    ...(hidePagination
      ? {}
      : {
          onPaginationChange: setPagination,
          getPaginationRowModel: getPaginationRowModel(),
        }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: hidePagination ? { sorting } : { sorting, pagination },
  })

  const tableRef = useRef(table)
  tableRef.current = table

  const handlePageSizeValueChange = useCallback((value: string) => {
    tableRef.current.setPageSize(Number(value))
    tableRef.current.setPageIndex(0)
  }, [])

  const hasRows = data.length > 0

  /** When set, reserve capped viewport height for empty + loaded (staking history). */
  const useCappedViewportSlots = viewportMaxBodyRows != null
  const useLegacyCappedHeight =
    hasRows && maxBodyRowsBeforeScroll != null && !useCappedViewportSlots

  const fillParent =
    (!compactEmpty || hasRows) &&
    !useCappedViewportSlots &&
    !useLegacyCappedHeight &&
    maxBodyRowsBeforeScroll === undefined

  const bodyRowCount = table.getRowModel().rows.length
  const pageSize = table.getState().pagination.pageSize

  const viewportCap = viewportMaxBodyRows ?? maxViewportBodyRows
  const viewportFloor = viewportMinBodyRows ?? 3

  const skeletonRowCount =
    showBodySkeleton && !hasRows && compact
      ? Math.max(1, bodySkeletonRowCount ?? viewportFloor)
      : 0

  const { dynamicMinHeight, dynamicMaxHeight, cappedBodySlotCount } =
    useMemo(() => {
      if (useCappedViewportSlots && viewportCap != null) {
        const effectiveBodyRows = hasRows ? bodyRowCount : 0
        const slotCount = Math.min(
          viewportCap,
          Math.max(viewportFloor, effectiveBodyRows)
        )
        const minSlots = Math.min(viewportCap, viewportFloor)
        return {
          dynamicMinHeight: `calc(${viewportHeaderRem}rem + ${minSlots} * ${viewportBodyRem}rem)`,
          dynamicMaxHeight: `calc(${viewportHeaderRem}rem + ${slotCount} * ${viewportBodyRem}rem)`,
          cappedBodySlotCount: slotCount,
        }
      }

      if (useLegacyCappedHeight) {
        const softViewportRows =
          maxBodyRowsBeforeScroll != null
            ? Math.max(3, maxBodyRowsBeforeScroll, pageSize)
            : null
        const hardCappedRows =
          softViewportRows != null && maxViewportBodyRows != null
            ? Math.min(softViewportRows, maxViewportBodyRows)
            : softViewportRows
        const heightBudgetRows =
          hardCappedRows != null
            ? Math.min(bodyRowCount, hardCappedRows)
            : null
        if (heightBudgetRows == null) {
          return {
            dynamicMinHeight: undefined,
            dynamicMaxHeight: undefined,
            cappedBodySlotCount: 0,
          }
        }
        return {
          dynamicMinHeight: undefined,
          dynamicMaxHeight: `calc(${viewportHeaderRem}rem + ${heightBudgetRows} * ${viewportBodyRem}rem)`,
          cappedBodySlotCount: 0,
        }
      }

    return {
      dynamicMinHeight: undefined,
      dynamicMaxHeight: undefined,
      cappedBodySlotCount: 0,
    }
  }, [
    hasRows,
    useCappedViewportSlots,
    useLegacyCappedHeight,
    viewportCap,
    viewportFloor,
    bodyRowCount,
    viewportHeaderRem,
    viewportBodyRem,
    maxBodyRowsBeforeScroll,
    maxViewportBodyRows,
    pageSize,
  ])

  const useDynamicHeight = useCappedViewportSlots || useLegacyCappedHeight

  const scrollRef = useRef<HTMLDivElement>(null)
  const onNearScrollEndRef = useRef(onNearScrollEnd)
  onNearScrollEndRef.current = onNearScrollEnd
  const canLoadMoreRef = useRef(canLoadMore)
  canLoadMoreRef.current = canLoadMore

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !canLoadMore) return

    const thresholdPx = 72
    let scrollRaf = 0
    const check = () => {
      if (!canLoadMoreRef.current) return
      if (el.scrollHeight - el.scrollTop - el.clientHeight < thresholdPx) {
        onNearScrollEndRef.current?.()
      }
    }

    const scheduleCheck = () => {
      if (scrollRaf !== 0) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        check()
      })
    }

    el.addEventListener("scroll", scheduleCheck, { passive: true })
    check()
    const RO = typeof ResizeObserver !== "undefined" ? ResizeObserver : null
    const ro = RO ? new RO(() => scheduleCheck()) : null
    if (ro) ro.observe(el)
    return () => {
      if (scrollRaf !== 0) {
        cancelAnimationFrame(scrollRaf)
        scrollRaf = 0
      }
      el.removeEventListener("scroll", scheduleCheck)
      ro?.disconnect()
    }
  }, [canLoadMore, data.length])

  const showPaginationFooter =
    !hidePagination &&
    hasRows &&
    (!collapsePaginationWhenSinglePage || table.getPageCount() > 1)

  const stickyHeaderClass =
    useDynamicHeight &&
    "[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white [&_th]:shadow-[0_1px_0_0_rgb(229_229_229)]"

  const compactHeaderClass =
    compact &&
    "[&_tr]:border-b-0 [&_th]:h-7 [&_th]:border-b-0 [&_th]:py-1 [&_th]:px-1.5 md:[&_th]:px-2 [&_th]:text-[12px] [&_th]:font-medium [&_th]:leading-none [&_th]:whitespace-nowrap [&_th]:shadow-none sm:[&_th]:h-8 sm:[&_th]:py-1.5 sm:[&_th]:text-[13px] sm:[&_th]:leading-snug"

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col",
        fillParent && "flex-1",
        className
      )}
    >
      <div
        ref={node => assignViewportScrollRef(scrollRef, viewportScrollRef, node)}
        className={cn(
          "flex min-h-0 min-w-0 flex-col",
          fillParent && "flex-1",
          useDynamicHeight &&
            "min-h-0 shrink-0 overflow-y-auto overflow-x-auto scrollbar-none",
          !embedded &&
            cn(
              "rounded-md border border-neutral-200",
              !useDynamicHeight && "overflow-hidden"
            )
        )}
        style={{
          ...(dynamicMaxHeight ? { maxHeight: dynamicMaxHeight } : {}),
          ...(dynamicMinHeight ? { minHeight: dynamicMinHeight } : {}),
        }}
        aria-busy={skeletonRowCount > 0 || undefined}
      >
        <Table
          className={cn(
            compact
              ? "w-full min-w-0 table-fixed border-collapse text-[12px] leading-snug sm:text-[13px] sm:leading-normal [&_tbody>tr>td]:border-b [&_tbody>tr>td]:border-neutral-200 [&_tbody>tr:last-child>td]:border-b-0"
              : "min-w-176",
            tableClassName
          )}
          shrinkWrap={useDynamicHeight}
          containerClassName={
            useDynamicHeight ? "overflow-visible" : "scrollbar-none"
          }
        >
          <TableHeader className={cn(stickyHeaderClass, compactHeaderClass)}>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                className={cn(compact && "border-b-0")}
              >
                {headerGroup.headers.map(header => {
                  const noClip =
                    compact &&
                    readDataTableColumnMeta(header.column.columnDef.meta)
                      .compactNoClip
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(noClip && COMPACT_NO_CLIP_HEAD)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {skeletonRowCount > 0 ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIdx) => (
                <TableRow
                  key={`datatable-sk-${rowIdx}`}
                  className={cn(compact && "border-b-0")}
                >
                  {table.getAllLeafColumns().map(column => {
                    const meta = readDataTableColumnMeta(column.columnDef.meta)
                    const noClip = compact && Boolean(meta.compactNoClip)
                    const justify = meta.skeletonCellJustify
                    return (
                      <TableCell
                        key={column.id}
                        className={cn(
                          compact &&
                            (noClip ? COMPACT_NO_CLIP_CELL : COMPACT_CLIP_CELL)
                        )}
                      >
                        <div
                          className={cn(
                            "flex min-h-0 min-w-0 w-full max-w-full items-center",
                            compact && !noClip && "overflow-hidden",
                            compact && noClip && "overflow-visible",
                            compact &&
                              bodyRowRemProp == null &&
                              "min-h-6.5 sm:min-h-7.5",
                            justify === "center" && "justify-center",
                            justify === "end" && "justify-end"
                          )}
                          style={
                            bodyRowRemProp != null
                              ? { minHeight: `${bodyRowRem}rem` }
                              : compact
                                ? undefined
                                : { minHeight: `${bodyRowRem}rem` }
                          }
                        >
                          <Skeleton
                            className={cn(
                              "bg-neutral-200/80",
                              meta.skeletonClassName ?? "h-4 w-20 rounded-full"
                            )}
                          />
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(compact && "border-b-0")}
                >
                  {row.getVisibleCells().map(cell => {
                    const noClip =
                      compact &&
                      readDataTableColumnMeta(cell.column.columnDef.meta)
                        .compactNoClip
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          compact &&
                            (noClip ? COMPACT_NO_CLIP_CELL : COMPACT_CLIP_CELL)
                        )}
                      >
                        <div
                          className={cn(
                            "flex min-h-0 min-w-0 w-full max-w-full items-center",
                            compact && !noClip && "overflow-hidden",
                            compact && noClip && "overflow-visible",
                            compact &&
                              bodyRowRemProp == null &&
                              "min-h-6.5 sm:min-h-7.5"
                          )}
                          style={
                            bodyRowRemProp != null
                              ? { minHeight: `${bodyRowRem}rem` }
                              : compact
                                ? undefined
                                : { minHeight: `${bodyRowRem}rem` }
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow
                className={cn("hover:bg-transparent", compact && "border-b-0")}
              >
                <TableCell
                  colSpan={columns.length}
                  className={cn(
                    "text-center align-middle text-sm leading-relaxed text-neutral-500",
                    useCappedViewportSlots && !hasRows
                      ? "p-0"
                      : compactEmpty
                        ? "px-4 py-5 sm:py-6"
                        : "min-h-48 px-4 py-12 sm:min-h-56"
                  )}
                >
                  {useCappedViewportSlots && !hasRows ? (
                    <div
                      className={cn(
                        "flex w-full min-w-0 items-center justify-center",
                        renderCappedViewportEmpty
                          ? "px-2 py-2 sm:px-3 sm:py-3"
                          : cn(
                              "px-4",
                              compactEmpty
                                ? "py-5 sm:py-6"
                                : "min-h-48 py-12 sm:min-h-56"
                            )
                      )}
                      style={{
                        minHeight: `calc(${cappedBodySlotCount} * ${viewportBodyRem}rem)`,
                      }}
                    >
                      {renderCappedViewportEmpty ? (
                        renderCappedViewportEmpty(emptyMessage)
                      ) : (
                        emptyMessage
                      )}
                    </div>
                  ) : (
                    emptyMessage
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPaginationFooter ? (
        <div
          className={cn(
            "mt-3 shrink-0 border-neutral-200 pt-3",
            embedded ? "border-t" : "border-t sm:px-2"
          )}
        >
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-muted-foreground order-2 text-center text-sm sm:order-1 sm:text-start">
              <span>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </span>
              <span className="text-neutral-300"> · </span>
              <span>{data.length} row(s)</span>
            </p>
            <div className="order-1 flex w-full min-w-0 flex-wrap items-center justify-center gap-2 sm:order-2 sm:w-auto sm:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground shrink-0 text-sm whitespace-nowrap">Rows</span>
                <DataTablePageSizeSelect
                  value={String(table.getState().pagination.pageSize)}
                  pageSizeOptions={pageSizeOptions}
                  onValueChange={handlePageSizeValueChange}
                />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
