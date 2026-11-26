export type DatasetKey =
  | 'students'
  | 'teachers'
  | 'guardians'
  | 'groups'
  | 'enrollments'
  | 'sessions'
  | 'attendance'
  | 'payments'
  | 'dues'
  | 'expenses'
  | 'payroll'
  | 'documents_meta'
  | 'reports_summary';

export type ColumnFormat =
  | 'text'
  | 'integer'
  | 'decimal'
  | 'currency_mad'
  | 'percent'
  | 'date'
  | 'time'
  | 'phone'
  | 'email'
  | 'status'
  | 'select'
  | 'boolean'
  | 'relation';

export interface StudioColumnDef {
  key: string;
  label: string;
  format: ColumnFormat;
  width: number;
  visible: boolean;
  editable: boolean;
  required?: boolean;
  sensitive?: boolean;
  lockedReason?: string;
  workflowHref?: string;
  options?: string[];
}

export type StudioCellValue = string | number | boolean | undefined;

export interface StudioRow {
  id: string;
  _dirty?: boolean;
  _isNew?: boolean;
  _lockedRow?: boolean;
  [key: string]: StudioCellValue;
}

export interface CellValidationError {
  rowId: string;
  rowIndex: number;
  colKey: string;
  colLabel: string;
  message: string;
}

export interface FilterCondition {
  id: string;
  colKey: string;
  operator: 'contains' | 'equals' | 'gt' | 'lt' | 'empty' | 'not_empty';
  value: string;
}

export type GridDensity = 'compact' | 'normal' | 'comfortable';

export interface SavedStudioView {
  id: string;
  centerId: string;
  name: string;
  dataset: DatasetKey;
  shared: boolean;
  visibleColumns: string[];
  pinnedFirstCol: boolean;
  density: GridDensity;
  filters: FilterCondition[];
  filterLogic: 'AND' | 'OR';
  sortCol?: string;
  sortDir?: 'asc' | 'desc';
}

export interface StudioHistoryEntry {
  id: string;
  timestampLabel: string;
  summary: string;
  rowsSnapshot: StudioRow[];
}

export type ExportFormat = 'csv' | 'xls_xml' | 'json' | 'print_pdf' | 'blank_template';
export type ExportScope = 'selected' | 'filtered' | 'all';

export interface ExportTemplateConfig {
  id: string;
  centerId: string;
  name: string;
  dataset: DatasetKey;
  predefined: boolean;
  columns: Array<{ sourceKey: string; exportHeader: string }>;
  separator: ';' | ',';
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  decimalSeparator: ',' | '.';
  includeTotals: boolean;
}

export interface ImportJobRecord {
  id: string;
  centerId: string;
  dateLabel: string;
  actor: string;
  fileName: string;
  dataset: DatasetKey | 'custom_draft';
  datasetLabel: string;
  strategy: 'create' | 'update' | 'skip_duplicates';
  totalRows: number;
  acceptedRows: number;
  warningsCount: number;
  rejectedRows: number;
  status: 'simule_en_memoire' | 'annule';
  importedRowIds: string[];
}

export interface ExportJobRecord {
  id: string;
  centerId: string;
  dateLabel: string;
  actor: string;
  templateName: string;
  datasetLabel: string;
  format: ExportFormat;
  rowsCount: number;
  status: 'telecharge_demo';
}
