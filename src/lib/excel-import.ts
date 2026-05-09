import type { Player } from "./types";
import { makePlayer } from "./defaults";

export interface ExcelParseResult {
  players: Player[];
  warnings: string[];
  errors: string[];
}

const TRUE_TOKENS = new Set([
  "true",
  "evet",
  "1",
  "x",
  "yes",
  "var",
  "y",
]);

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (v == null) return false;
  return TRUE_TOKENS.has(String(v).trim().toLowerCase());
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null || v === "") return 0;
  const s = String(v).replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

const HEADER_MAP: Record<string, "name" | "advance" | "matches" | "exempt"> = {
  ad: "name",
  isim: "name",
  oyuncu: "name",
  name: "name",

  "ilk ücret": "advance",
  "ilk ucret": "advance",
  ilkucret: "advance",
  avans: "advance",
  ücret: "advance",
  ucret: "advance",
  advance: "advance",

  "oyun sayısı": "matches",
  "oyun sayisi": "matches",
  oyun: "matches",
  "maç sayısı": "matches",
  "mac sayisi": "matches",
  maç: "matches",
  mac: "matches",
  matches: "matches",

  muaf: "exempt",
  exempt: "exempt",
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export async function parseRosterExcel(file: File): Promise<ExcelParseResult> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : null;
  if (!sheet) {
    return { players: [], warnings: [], errors: ["Excel'de sayfa bulunamadı."] };
  }
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });
  if (rows.length === 0) {
    return {
      players: [],
      warnings: [],
      errors: ["Excel boş veya başlıkları okunamadı."],
    };
  }

  const headers = Object.keys(rows[0]);
  const colMap: Record<string, "name" | "advance" | "matches" | "exempt"> = {};
  for (const h of headers) {
    const mapped = HEADER_MAP[normalize(h)];
    if (mapped) colMap[h] = mapped;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const have = new Set(Object.values(colMap));
  if (!have.has("name")) errors.push("Zorunlu sütun eksik: 'ad'");
  if (!have.has("advance")) errors.push("Zorunlu sütun eksik: 'ilk ücret'");
  if (!have.has("matches")) errors.push("Zorunlu sütun eksik: 'oyun sayısı'");
  if (!have.has("exempt"))
    warnings.push("'muaf' sütunu yok — herkes muaf olmayan kabul edildi.");

  if (errors.length > 0) return { players: [], warnings, errors };

  const players: Player[] = [];
  for (const row of rows) {
    const data: Record<string, unknown> = {};
    for (const [orig, mapped] of Object.entries(colMap)) {
      data[mapped] = row[orig];
    }
    const name = String(data.name ?? "").trim();
    if (!name) continue;
    players.push(
      makePlayer(name, {
        advance: toNumber(data.advance),
        matches: toNumber(data.matches),
        exempt: toBool(data.exempt),
      }),
    );
  }
  return { players, warnings, errors };
}

export async function generateRosterTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const data = [
    ["ad", "ilk ücret", "oyun sayısı", "muaf"],
    ["Kemal", 5000, 5, false],
    ["Ali", 4000, 4, false],
    ["Davetli", 0, 3, true],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kadro");
  XLSX.writeFile(wb, "kadro-sablonu.xlsx");
}
