import type { Player } from "./types";
import { makePlayer } from "./defaults";

export interface ExcelParseResult {
  players: Player[];
  warnings: string[];
  errors: string[];
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null || v === "") return 0;
  const s = String(v).replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

const HEADER_MAP: Record<string, "name" | "advance" | "matches"> = {
  "oyuncu adı": "name",
  "oyuncu adi": "name",
  oyuncu: "name",
  ad: "name",
  isim: "name",
  name: "name",

  "i̇lk ücret": "advance",
  "ilk ücret": "advance",
  "ilk ucret": "advance",
  ilkucret: "advance",
  avans: "advance",
  ücret: "advance",
  ucret: "advance",
  advance: "advance",

  "maç sayısı": "matches",
  "mac sayisi": "matches",
  macsayisi: "matches",
  "oyun sayısı": "matches",
  "oyun sayisi": "matches",
  oyunsayisi: "matches",
  oyun: "matches",
  maç: "matches",
  mac: "matches",
  matches: "matches",
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
  const colMap: Record<string, "name" | "advance" | "matches"> = {};
  for (const h of headers) {
    const mapped = HEADER_MAP[normalize(h)];
    if (mapped) colMap[h] = mapped;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const have = new Set(Object.values(colMap));
  if (!have.has("name")) errors.push("Zorunlu sütun eksik: 'Oyuncu Adı'");
  if (!have.has("advance")) errors.push("Zorunlu sütun eksik: 'İlk Ücret'");
  if (!have.has("matches")) errors.push("Zorunlu sütun eksik: 'Maç Sayısı'");

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
      }),
    );
  }
  return { players, warnings, errors };
}

export async function generateRosterTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const data = [
    ["Oyuncu Adı", "İlk Ücret", "Maç Sayısı"],
    ["Kemal", 5000, 5],
    ["Ali", 4000, 4],
    ["Mehmet", 3500, 3],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kadro");
  XLSX.writeFile(wb, "kadro-ornek.xlsx");
}
