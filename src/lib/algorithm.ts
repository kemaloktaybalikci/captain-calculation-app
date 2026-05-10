import type {
  CalculationResult,
  Config,
  Player,
  PlayerResult,
  SettlementResult,
  Transfer,
} from "./types";
import { minimumTransfers } from "./min-transfer";
import { round2 } from "./format";

const EPS = 0.005;

export function calculate(
  config: Config,
  players: Player[],
): CalculationResult {
  if (players.length === 0) {
    return {
      perPlayer: [],
      costPerMatch: 0,
      totalShareDistributed: 0,
      kasaBalance: 0,
      warnings: ["Oyuncu listesi boş."],
    };
  }
  const warnings: string[] = [];
  const totalAdvance = players.reduce((s, p) => s + p.advance, 0);
  const lDist = config.leagueFee - config.sponsorContribution;
  const M_nonExempt = players
    .filter((p) => !p.exempt)
    .reduce((s, p) => s + p.matches, 0);

  const collectedPlusSponsor = totalAdvance + config.sponsorContribution;
  if (Math.abs(collectedPlusSponsor - config.leagueFee) > 0.5) {
    const diff = collectedPlusSponsor - config.leagueFee;
    warnings.push(
      `Maç Başı Pay: toplanan (${totalAdvance.toFixed(2)}) + sponsor (${config.sponsorContribution.toFixed(2)}) = ${collectedPlusSponsor.toFixed(2)} TL, ` +
        `lig ücreti ${config.leagueFee.toFixed(2)} TL ile eşleşmiyor (fark ${diff.toFixed(2)} TL).`,
    );
  }

  let costPerMatch = 0;
  if (M_nonExempt <= 0) {
    warnings.push("Muaf olmayan oyuncuların maç sayısı 0 — pay hesaplanamadı.");
  } else if (lDist < 0) {
    warnings.push("Sponsor katkısı lig ücretini aşıyor.");
  } else {
    costPerMatch = lDist / M_nonExempt;
  }

  const results: PlayerResult[] = players.map((p) => {
    const share = p.exempt ? 0 : p.matches * costPerMatch;
    const net = p.advance - share;
    return {
      playerId: p.id,
      name: p.name,
      matches: p.matches,
      advance: p.advance,
      exempt: p.exempt,
      share,
      net,
      finalNet: net,
      notes: p.exempt ? ["Muaf — payı sıfır"] : [],
    };
  });

  const totalShare = results.reduce((s, r) => s + r.share, 0);
  const sumFinalNet = results.reduce((s, r) => s + r.finalNet, 0);
  const kasaBalance =
    totalAdvance + config.sponsorContribution - config.leagueFee - sumFinalNet;

  return {
    perPlayer: results,
    costPerMatch,
    totalShareDistributed: totalShare,
    kasaBalance,
    warnings,
  };
}

export function settle(
  config: Config,
  calc: CalculationResult,
): SettlementResult {
  if (config.settlementMode === "kasa") {
    const inflows: Transfer[] = [];
    const outflows: Transfer[] = [];
    for (const r of calc.perPlayer) {
      if (r.finalNet > EPS) {
        outflows.push({ from: "Kasa", to: r.name, amount: round2(r.finalNet) });
      } else if (r.finalNet < -EPS) {
        inflows.push({ from: r.name, to: "Kasa", amount: round2(-r.finalNet) });
      }
    }
    return {
      mode: "kasa",
      kasaInflows: inflows,
      kasaOutflows: outflows,
      kasaBalance: calc.kasaBalance,
    };
  }
  return {
    mode: "p2p",
    p2pTransfers: minimumTransfers(calc.perPlayer),
    kasaBalance: calc.kasaBalance,
  };
}
