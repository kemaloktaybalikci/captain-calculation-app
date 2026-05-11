import type {
  CalculationResult,
  Config,
  Player,
  PlayerResult,
  SettlementResult,
  Transfer,
} from "./types";
import { BASE_RATE_MAX, BASE_RATE_MIN } from "./types";
import { minimumTransfers } from "./min-transfer";
import { round2 } from "./format";

const EPS = 0.005;

export function calculate(
  config: Config,
  players: Player[],
): CalculationResult {
  if (players.length === 0) {
    return {
      mode: config.calcMode,
      perPlayer: [],
      costPerMatch: 0,
      totalShareDistributed: 0,
      totalBaseShare: 0,
      baseRatePercent: config.baseRatePercent,
      kasaBalance: 0,
      warnings: ["Oyuncu listesi boş."],
    };
  }
  if (config.calcMode === "base-rate") {
    return calculateBaseRate(config, players);
  }
  return calculatePerMatch(config, players);
}

function calculatePerMatch(
  config: Config,
  players: Player[],
): CalculationResult {
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
    const matchShare = p.exempt ? 0 : p.matches * costPerMatch;
    const share = matchShare;
    const net = p.advance - share;
    return {
      playerId: p.id,
      name: p.name,
      matches: p.matches,
      advance: p.advance,
      exempt: p.exempt,
      share,
      baseShare: 0,
      matchShare,
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
    mode: "per-match",
    perPlayer: results,
    costPerMatch,
    totalShareDistributed: totalShare,
    totalBaseShare: 0,
    baseRatePercent: config.baseRatePercent,
    kasaBalance,
    warnings,
  };
}

function calculateBaseRate(
  config: Config,
  players: Player[],
): CalculationResult {
  const warnings: string[] = [];
  const baseRatePercent = clampRate(config.baseRatePercent);
  const baseRate = baseRatePercent / 100;
  const totalAdvance = players.reduce((s, p) => s + p.advance, 0);
  const nonExemptPlayers = players.filter((p) => !p.exempt);
  const playerCost = config.leagueFee - config.sponsorContribution;
  const collectedPlusSponsor = totalAdvance + config.sponsorContribution;

  if (Math.abs(collectedPlusSponsor - config.leagueFee) > 0.5) {
    const diff = collectedPlusSponsor - config.leagueFee;
    warnings.push(
      `Katılım Payı + Maç Başı Pay: toplanan (${totalAdvance.toFixed(2)}) + sponsor (${config.sponsorContribution.toFixed(2)}) = ${collectedPlusSponsor.toFixed(2)} TL, ` +
        `lig ücreti ${config.leagueFee.toFixed(2)} TL ile eşleşmiyor (fark ${diff.toFixed(2)} TL).`,
    );
  }

  const totalFixed = round2(Math.max(0, playerCost) * baseRate);
  const perPlayerBaseShare =
    nonExemptPlayers.length > 0 ? totalFixed / nonExemptPlayers.length : 0;

  const M_nonExempt = nonExemptPlayers.reduce((s, p) => s + p.matches, 0);

  const distributable = playerCost - totalFixed;
  let costPerMatch = 0;
  if (M_nonExempt <= 0) {
    warnings.push("Muaf olmayan oyuncuların maç sayısı 0 — maç payı hesaplanamadı.");
  } else if (playerCost < 0) {
    warnings.push("Sponsor katkısı lig ücretini aşıyor.");
  } else if (distributable < 0) {
    warnings.push(
      `Katılım payı oranı çok yüksek: katılım payı (${totalFixed.toFixed(2)}) oyunculara dağıtılacak tutarı aşıyor.`,
    );
  } else {
    costPerMatch = distributable / M_nonExempt;
  }

  const results: PlayerResult[] = players.map((p) => {
    const baseShare = p.exempt ? 0 : perPlayerBaseShare;
    const matchShare = p.exempt ? 0 : p.matches * costPerMatch;
    const share = baseShare + matchShare;
    const net = p.advance - share;
    return {
      playerId: p.id,
      name: p.name,
      matches: p.matches,
      advance: p.advance,
      exempt: p.exempt,
      share,
      baseShare,
      matchShare,
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
    mode: "base-rate",
    perPlayer: results,
    costPerMatch,
    totalShareDistributed: totalShare,
    totalBaseShare: totalFixed,
    baseRatePercent,
    kasaBalance,
    warnings,
  };
}

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return BASE_RATE_MIN;
  return Math.max(BASE_RATE_MIN, Math.min(BASE_RATE_MAX, value));
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
