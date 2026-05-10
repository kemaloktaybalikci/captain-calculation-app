import type {
  CalculationResult,
  Config,
  Player,
  SettlementResult,
} from "./types";
import { round2 } from "./format";

type Cell = string | number | null;

interface MergeRange {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

const COLS = 6;
const lastCol = COLS - 1;

export async function exportResultsToExcel(args: {
  config: Config;
  players: Player[];
  calc: CalculationResult;
  settlement: SettlementResult;
}): Promise<void> {
  const XLSX = await import("xlsx");
  const { config, calc, settlement } = args;

  const totalAdvance = calc.perPlayer.reduce((s, r) => s + r.advance, 0);
  const today = new Date().toLocaleDateString("tr-TR");
  const isKasa = settlement.mode === "kasa";
  const isBaseRate = calc.mode === "base-rate";
  const modeLabel = isBaseRate ? "Baz Oranlı Pay" : "Maç Başı Pay";

  const rows: Cell[][] = [];
  const merges: MergeRange[] = [];

  const pushBanner = (text: string) => {
    rows.push([text]);
    const r = rows.length - 1;
    merges.push({ s: { r, c: 0 }, e: { r, c: lastCol } });
  };

  // Title
  pushBanner(`Kaptan Hesap — ${modeLabel} · ${today}`);
  rows.push([]);

  // Stats — two columns of label/value pairs
  rows.push([
    "Lig Ücreti",
    config.leagueFee,
    "",
    "Maç Birim Maliyet",
    round2(calc.costPerMatch),
    "",
  ]);
  if (isBaseRate) {
    rows.push([
      `Baz Oran (%${calc.baseRatePercent})`,
      round2(calc.totalBaseShare),
      "",
      "Maçlara Dağıtılan",
      round2(calc.totalShareDistributed - calc.totalBaseShare),
      "",
    ]);
  } else {
    rows.push([
      "Sponsor / Ek Ödeme",
      config.sponsorContribution,
      "",
      "Toplam Dağıtılan Pay",
      round2(calc.totalShareDistributed),
      "",
    ]);
  }
  rows.push([
    "Toplanan Avans",
    round2(totalAdvance),
    "",
    "Kasa Bakiyesi",
    round2(calc.kasaBalance),
    Math.abs(calc.kasaBalance) <= 0.5
      ? "Dengede"
      : calc.kasaBalance > 0
        ? "Artık var"
        : "Açık",
  ]);
  rows.push([]);

  // Section: Settlement flow (centerpiece)
  pushBanner(
    `MAHSUPLAŞMA — ${isKasa ? "Kasa Merkezli (kim kasaya ne öder, kasa kime ne öder)" : "Peer-to-Peer (kim doğrudan kime öder)"}`,
  );
  rows.push(["Kimden", "Kime", "Tutar (TL)", "Açıklama", "", ""]);

  if (isKasa) {
    if (settlement.kasaInflows.length === 0 && settlement.kasaOutflows.length === 0) {
      rows.push(["—", "—", 0, "Mahsup gerekmiyor", "", ""]);
    } else {
      for (const t of settlement.kasaInflows) {
        rows.push([t.from, t.to, round2(t.amount), "Kasaya ödenecek", "", ""]);
      }
      for (const t of settlement.kasaOutflows) {
        rows.push([t.from, t.to, round2(t.amount), "Kasadan alınacak", "", ""]);
      }
    }
    const totalIn = settlement.kasaInflows.reduce((s, t) => s + t.amount, 0);
    const totalOut = settlement.kasaOutflows.reduce((s, t) => s + t.amount, 0);
    rows.push([]);
    rows.push([
      "Toplam Giriş",
      round2(totalIn),
      "Toplam Çıkış",
      round2(totalOut),
      "Kasa Bakiyesi",
      round2(calc.kasaBalance),
    ]);
  } else {
    if (settlement.p2pTransfers.length === 0) {
      rows.push(["—", "—", 0, "Mahsup gerekmiyor", "", ""]);
    } else {
      for (const t of settlement.p2pTransfers) {
        rows.push([t.from, t.to, round2(t.amount), "Doğrudan transfer", "", ""]);
      }
    }
    if (Math.abs(calc.kasaBalance) > 0.5) {
      rows.push([]);
      pushBanner(
        `Not: Peer-to-peer mahsuplaşma sonrası kasada ${round2(calc.kasaBalance)} TL bakiye kalıyor.`,
      );
    }
  }

  rows.push([]);

  // Section: Per-player breakdown
  pushBanner("OYUNCULAR");
  if (isBaseRate) {
    rows.push([
      "Oyuncu Adı",
      "Maç Sayısı",
      "İlk Ücret",
      "Sabit",
      "Maç Payı",
      "Toplam Pay",
    ]);
  } else {
    rows.push(["Oyuncu Adı", "Maç Sayısı", "İlk Ücret", "Pay", "Net", "Durum"]);
  }
  for (const r of calc.perPlayer) {
    const status = r.exempt
      ? "Muaf"
      : r.finalNet > 0.5
        ? isKasa
          ? "Kasadan alacaklı"
          : "Alacaklı"
        : r.finalNet < -0.5
          ? isKasa
            ? "Kasaya borçlu"
            : "Borçlu"
          : "Eşit";
    if (isBaseRate) {
      rows.push([
        r.name,
        r.matches,
        round2(r.advance),
        round2(r.baseShare),
        round2(r.matchShare),
        round2(r.share),
      ]);
    } else {
      rows.push([
        r.name,
        r.matches,
        round2(r.advance),
        round2(r.share),
        round2(r.finalNet),
        status,
      ]);
    }
  }
  if (isBaseRate) {
    rows.push([
      "TOPLAM",
      calc.perPlayer.reduce((s, r) => s + r.matches, 0),
      round2(totalAdvance),
      round2(calc.totalBaseShare),
      round2(calc.totalShareDistributed - calc.totalBaseShare),
      round2(calc.totalShareDistributed),
    ]);
  } else {
    rows.push([
      "TOPLAM",
      calc.perPlayer.reduce((s, r) => s + r.matches, 0),
      round2(totalAdvance),
      round2(calc.totalShareDistributed),
      round2(calc.perPlayer.reduce((s, r) => s + r.finalNet, 0)),
      "",
    ]);
  }

  if (calc.warnings.length > 0) {
    rows.push([]);
    pushBanner("UYARILAR");
    for (const w of calc.warnings) {
      rows.push([w]);
      const r = rows.length - 1;
      merges.push({ s: { r, c: 0 }, e: { r, c: lastCol } });
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 22 },
  ];
  ws["!merges"] = merges;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mahsup");

  // Detail sheet — full per-player breakdown for transparency
  const detailHeader: Cell[] = isBaseRate
    ? [
        "Oyuncu Adı",
        "Muaf",
        "Maç Sayısı",
        "İlk Ücret",
        "Sabit",
        "Maç Payı",
        "Toplam Pay",
        "Net",
        "Notlar",
      ]
    : [
        "Oyuncu Adı",
        "Muaf",
        "Maç Sayısı",
        "İlk Ücret",
        "Pay",
        "Net",
        "Notlar",
      ];
  const detail: Cell[][] = [
    detailHeader,
    ...calc.perPlayer.map((r): Cell[] =>
      isBaseRate
        ? [
            r.name,
            r.exempt ? "Evet" : "Hayır",
            r.matches,
            round2(r.advance),
            round2(r.baseShare),
            round2(r.matchShare),
            round2(r.share),
            round2(r.finalNet),
            r.notes.join(" | "),
          ]
        : [
            r.name,
            r.exempt ? "Evet" : "Hayır",
            r.matches,
            round2(r.advance),
            round2(r.share),
            round2(r.finalNet),
            r.notes.join(" | "),
          ],
    ),
  ];
  const wsDetail = XLSX.utils.aoa_to_sheet(detail);
  wsDetail["!cols"] = isBaseRate
    ? [
        { wch: 20 },
        { wch: 8 },
        { wch: 8 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 36 },
      ]
    : [
        { wch: 20 },
        { wch: 8 },
        { wch: 8 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 36 },
      ];
  XLSX.utils.book_append_sheet(wb, wsDetail, "Detay");

  XLSX.writeFile(
    wb,
    `kaptan-hesap-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
