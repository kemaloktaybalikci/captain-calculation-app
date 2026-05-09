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
  return config.topMode === "full-settlement"
    ? calcFullSettlement(config, players)
    : calcPerMatch(config, players);
}

function calcFullSettlement(
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
      `Tam Mahsup: toplanan (${totalAdvance.toFixed(2)}) + sponsor (${config.sponsorContribution.toFixed(2)}) = ${collectedPlusSponsor.toFixed(2)} TL, ` +
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
      forgiven: false,
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

function calcPerMatch(config: Config, players: Player[]): CalculationResult {
  const warnings: string[] = [];
  const totalAdvance = players.reduce((s, p) => s + p.advance, 0);
  const nonExempt = players.filter((p) => !p.exempt);
  const costPerMatch = config.costPerMatch;

  if (costPerMatch <= 0) warnings.push("Maç başı bedel 0 — bir değer girin.");
  if (nonExempt.length === 0) warnings.push("Muaf olmayan oyuncu yok.");

  const W = config.woCount;
  const woPerNonExempt =
    nonExempt.length > 0 ? (W * costPerMatch) / nonExempt.length : 0;

  const results: PlayerResult[] = players.map((p) => {
    if (p.exempt) {
      return {
        playerId: p.id,
        name: p.name,
        matches: p.matches,
        advance: p.advance,
        exempt: true,
        share: 0,
        net: p.advance,
        forgiven: false,
        finalNet: p.advance,
        notes: ["Muaf — payı sıfır"],
      };
    }
    let share = p.matches * costPerMatch + woPerNonExempt;
    const notes: string[] = [];
    if (
      config.minRegistrationFee > 0 &&
      p.matches === 0 &&
      p.advance > 0 &&
      share < config.minRegistrationFee
    ) {
      share = config.minRegistrationFee;
      notes.push(`Min giriş ücreti uygulandı (${config.minRegistrationFee} TL)`);
    }
    const net = p.advance - share;
    return {
      playerId: p.id,
      name: p.name,
      matches: p.matches,
      advance: p.advance,
      exempt: false,
      share,
      net,
      forgiven: false,
      finalNet: net,
      notes,
    };
  });

  const tol = config.tolerance;
  if (tol.type !== "none" && costPerMatch > 0) {
    for (const r of results) {
      if (r.exempt) continue;
      let inTol = false;
      if (tol.type === "matches") {
        const expected = r.advance / costPerMatch;
        if (Math.abs(r.matches - expected) <= tol.matchBand) {
          inTol = true;
          r.notes.push(
            `Beklenen ${expected.toFixed(2)} maç, oynanan ${r.matches} (bant ±${tol.matchBand})`,
          );
        }
      } else {
        if (Math.abs(r.net) <= tol.moneyThreshold) {
          inTol = true;
          r.notes.push(`|net| ≤ ${tol.moneyThreshold} TL`);
        }
      }
      if (inTol) {
        r.forgiven = true;
        r.finalNet = 0;
      }
    }
  }

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
