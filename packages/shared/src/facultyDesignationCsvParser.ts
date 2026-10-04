import { parseCsvRows } from './csvParserCore.js';

export interface FacultyDesignationCsvRow {
  code: string;
  name: string;
  hierarchyRank: number;
  isActive: boolean;
  assignableRoles: string[];
}

const ALIASES: Record<string, keyof FacultyDesignationCsvRow | 'skip'> = {
  code: 'code',
  name: 'name',
  hierarchyrank: 'hierarchyRank',
  hierarchy_rank: 'hierarchyRank',
  rank: 'hierarchyRank',
  isactive: 'isActive',
  is_active: 'isActive',
  active: 'isActive',
  assignableroles: 'assignableRoles',
  assignable_roles: 'assignableRoles',
  roles: 'assignableRoles',
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

/** Parse designations CSV into write-ready rows (match/upsert by code). */
export function parseFacultyDesignationsCsv(csvText: string): FacultyDesignationCsvRow[] {
  const grid = parseCsvRows(csvText);
  if (grid.length < 2) return [];
  const headers = grid[0].map(normHeader);
  const indexes = headers.map((h) => ALIASES[h] ?? 'skip');
  const out: FacultyDesignationCsvRow[] = [];

  for (let r = 1; r < grid.length; r += 1) {
    const cells = grid[r];
    if (!cells.some((c) => c.trim())) continue;
    let code = '';
    let name = '';
    let hierarchyRank = 10;
    let isActive = true;
    let assignableRoles: string[] = [];
    for (let c = 0; c < indexes.length; c += 1) {
      const key = indexes[c];
      const val = (cells[c] ?? '').trim();
      if (key === 'code') code = val;
      else if (key === 'name') name = val;
      else if (key === 'hierarchyRank') {
        const n = Number(val);
        if (Number.isFinite(n)) hierarchyRank = Math.min(99, Math.max(1, Math.floor(n)));
      } else if (key === 'isActive') isActive = parseBool(val);
      else if (key === 'assignableRoles') {
        assignableRoles = val
          ? val.split(/[|;]/).map((s) => s.trim()).filter(Boolean)
          : [];
      }
    }
    if (!code || !name) continue;
    out.push({ code, name, hierarchyRank, isActive, assignableRoles });
  }
  return out;
}
