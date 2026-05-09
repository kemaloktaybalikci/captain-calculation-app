import type { PlayerResult, Transfer } from "./types";

const EPS = 0.005;

export function minimumTransfers(results: PlayerResult[]): Transfer[] {
  const creditors = results
    .filter((r) => r.finalNet > EPS)
    .map((r) => ({ name: r.name, amount: r.finalNet }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = results
    .filter((r) => r.finalNet < -EPS)
    .map((r) => ({ name: r.name, amount: -r.finalNet }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    transfers.push({
      from: debtors[i].name,
      to: creditors[j].name,
      amount: round2(amount),
    });
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < EPS) i++;
    if (creditors[j].amount < EPS) j++;
  }
  return transfers;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
