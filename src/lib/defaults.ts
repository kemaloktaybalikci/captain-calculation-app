import type { AppState, Config, Player } from "./types";

export function makePlayer(
  name: string,
  opts: Partial<Omit<Player, "id" | "name">> = {},
): Player {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `p_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
    name,
    matches: opts.matches ?? 0,
    advance: opts.advance ?? 0,
    exempt: opts.exempt ?? false,
  };
}

export const defaultConfig: Config = {
  topMode: "full-settlement",
  leagueFee: 0,
  sponsorContribution: 0,
  settlementMode: "kasa",
};

export const defaultState: AppState = {
  config: defaultConfig,
  players: [],
  currentStep: 0,
};
