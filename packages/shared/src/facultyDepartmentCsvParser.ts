import { parseCsvRows } from './csvParserCore.js';

export interface FacultyDepartmentCsvRow {
  code: string;
  name: string;
  parentCode?: string;
  isActive: boolean;
}

const ALIASES: Record<string, keyof FacultyDepartmentCsvRow | 'skip'> = {
  code: 'code',
  name: 'name',
  parentcode: 'parentCode',
  parent_code: 'parentCode',
  isactive: 'isActive',
  is_active: 'isActive',
  active: 'isActive',
};

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '');
}

function parseBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (v === '' || v === '1' || v === 'true' || v === 'yes' || v === 'y') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'n') return false;
  return true;
}

/** Parse departments CSV into write-ready rows (match/upsert by code). */
export function parseFacultyDepartmentsCsv(csvText: string): FacultyDepartmentCsvRow[] {
  const grid = parseCsvRows(csvText);
  if (grid.length < 2) return [];
  const headers = grid[0].map(normHeader);
  const indexes = headers.map((h) => ALIASES[h] ?? 'skip');
  const out: FacultyDepartmentCsvRow[] = [];

  for (let r = 1; r < grid.length; r += 1) {
    const cells = grid[r];
    if (!cells.some((c) => c.trim())) continue;
    let code = '';
    let name = '';
    let parentCode: string | undefined;
    let isActive = true;
    for (let c = 0; c < indexes.length; c += 1) {
      const key = indexes[c];
      const val = (cells[c] ?? '').trim();
      if (key === 'code') code = val;
      else if (key === 'name') name = val;
      else if (key === 'parentCode') parentCode = val || undefined;
      else if (key === 'isActive') isActive = parseBool(val);
    }
    if (!code || !name) continue;
    out.push({ code, name, parentCode, isActive });
  }
  return out;
}
