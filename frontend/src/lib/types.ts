export type RawRow = Record<string, string>;

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRow {
  row_index: number;
  reason: string;
  raw: RawRow;
}

export interface ImportResponse {
  sourceHeaders: string[];
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  failedBatches: number;
  imported: CrmRecord[];
  skipped: SkippedRow[];
}

export type AppStep = "upload" | "preview" | "processing" | "results";
