'use client';

import React, { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '@/components/feedback/states';

export interface FacetOption {
  value: string;
  label: string;
}

export interface BulkAction<TData> {
  id: string;
  label: string;
  variant?: 'default' | 'outline' | 'destructive';
  onExecute: (selectedRows: TData[], clearSelection: () => void) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumnId?: string;
  facetColumnId?: string;
  facetOptions?: FacetOption[];
  enableRowSelection?: boolean;
  bulkActions?: BulkAction<TData>[];
  isLoading?: boolean;
  error?: { code?: '403' | '404' | '409' | '422' | '500' | 'offline'; message?: string } | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  renderMobileCard?: (row: TData, isSelected: boolean, toggleSelect: () => void) => React.ReactNode;
  toolbarExtra?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Rechercher...',
  facetColumnId,
  facetOptions,
  enableRowSelection = false,
  bulkActions = [],
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'Aucune donnée disponible',
  emptyDescription = 'Aucun élément n’a encore été ajouté dans cette vue.',
  emptyActionLabel,
  onEmptyAction,
  renderMobileCard,
  toolbarExtra,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeFacet, setActiveFacet] = useState<string>('all');

  const finalColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return columns;
    const selectionCol: ColumnDef<TData, TValue> = {
      id: '_select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? false : false)
          }
          aria-label="Tout sélectionner sur la page"
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(Boolean(value))
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          aria-label="Sélectionner la ligne"
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
    return [selectionCol, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleFacetChange = (value: string) => {
    setActiveFacet(value);
    if (!facetColumnId) return;
    const col = table.getColumn(facetColumnId);
    if (!col) return;
    col.setFilterValue(value === 'all' ? undefined : value);
  };

  const resetFilters = () => {
    setGlobalFilter('');
    setActiveFacet('all');
    setColumnFilters([]);
  };

  const selectedRowsData = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original);

  if (isLoading) {
    return <TableSkeleton rows={6} columns={Math.min(columns.length, 6)} />;
  }

  if (error) {
    return (
      <ErrorState
        code={error.code ?? '500'}
        description={error.message}
        onRetry={onRetry}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  const filteredRows = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const hasActiveFilter = globalFilter.trim().length > 0 || activeFacet !== 'all';

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-8 pr-7 pl-8 text-sm"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter('')}
                aria-label="Effacer la recherche"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {facetColumnId && facetOptions && facetOptions.length > 0 && (
            <div
              role="group"
              aria-label="Filtres de statut"
              className="inline-flex flex-wrap items-center rounded-lg border border-border bg-muted/50 p-0.5"
            >
              <button
                type="button"
                onClick={() => handleFacetChange('all')}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                  activeFacet === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Tous
              </button>
              {facetOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFacetChange(opt.value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                    activeFacet === opt.value
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {toolbarExtra}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                />
              }
            >
              <Columns3 className="size-3.5" />
              Colonnes
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Afficher / masquer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(Boolean(value))}
                  >
                    {typeof col.columnDef.header === 'string'
                      ? col.columnDef.header
                      : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk action bar */}
      {enableRowSelection && selectedRowsData.length > 0 && (
        <div
          role="region"
          aria-label="Actions groupées"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5"
        >
          <span className="text-xs font-medium text-foreground tabular-nums">
            {selectedRowsData.length} élément(s) sélectionné(s)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.id}
                type="button"
                size="xs"
                variant={action.variant ?? 'outline'}
                onClick={() =>
                  action.onExecute(selectedRowsData, () => setRowSelection({}))
                }
              >
                {action.label}
              </Button>
            ))}
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setRowSelection({})}
            >
              Désélectionner
            </Button>
          </div>
        </div>
      )}

      {/* No results after filtering */}
      {totalFiltered === 0 ? (
        <EmptyState
          variant="no-results"
          title="Aucun résultat correspondant"
          description="Aucun enregistrement ne correspond à votre recherche ou à vos filtres actuels."
          actionLabel={hasActiveFilter ? 'Effacer les filtres' : undefined}
          onAction={hasActiveFilter ? resetFilters : undefined}
        />
      ) : (
        <>
          {/* Mobile card list if provided */}
          {renderMobileCard && (
            <div className="space-y-2.5 md:hidden">
              {filteredRows.map((row) => (
                <React.Fragment key={row.id}>
                  {renderMobileCard(row.original, row.getIsSelected(), () =>
                    row.toggleSelected(!row.getIsSelected())
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Desktop / fallback horizontal scroll table */}
          <div
            className={cn(
              'overflow-x-auto rounded-xl border border-border bg-card',
              renderMobileCard && 'hidden md:block'
            )}
          >
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          className="h-10 px-3.5 font-medium whitespace-nowrap"
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {sorted === 'asc' ? (
                                <ArrowUp className="size-3.5 text-primary" />
                              ) : sorted === 'desc' ? (
                                <ArrowDown className="size-3.5 text-primary" />
                              ) : (
                                <ArrowUpDown className="size-3 opacity-50" />
                              )}
                            </button>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className="h-11 transition-colors hover:bg-muted/35 data-[state=selected]:bg-primary/5"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3.5 py-2.5 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalFiltered > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 pt-1 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 tabular-nums">
            <span>
              Page {table.getState().pagination.pageIndex + 1} sur{' '}
              {Math.max(1, table.getPageCount())} · {totalFiltered} résultat(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(val) => table.setPageSize(Number(val))}
            >
              <SelectTrigger size="sm" aria-label="Lignes par page" className="w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Page précédente"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Page suivante"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
