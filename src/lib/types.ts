export type TopMode = "full-settlement" | "per-match";

export type ToleranceType = "none" | "matches" | "money";

export type SettlementMode = "kasa" | "p2p";

export interface Player {
  id: string;
  name: string;
  matches: number;
  advance: number;
  exempt: boolean;
}

export interface ToleranceConfig {
  type: ToleranceType;
  matchBand: number;
  moneyThreshold: number;
}

export interface Config {
  topMode: TopMode;
  leagueFee: number;
  sponsorContribution: number;
  costPerMatch: number;
  woCount: number;
  tolerance: ToleranceConfig;
  minRegistrationFee: number;
  settlementMode: SettlementMode;
}

export interface PlayerResult {
  playerId: string;
  name: string;
  matches: number;
  advance: number;
  exempt: boolean;
  share: number;
  net: number;
  forgiven: boolean;
  finalNet: number;
  notes: string[];
}

export interface CalculationResult {
  perPlayer: PlayerResult[];
  costPerMatch: number;
  totalShareDistributed: number;
  kasaBalance: number;
  warnings: string[];
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export type SettlementResult =
  | {
      mode: "kasa";
      kasaInflows: Transfer[];
      kasaOutflows: Transfer[];
      kasaBalance: number;
    }
  | {
      mode: "p2p";
      p2pTransfers: Transfer[];
      kasaBalance: number;
    };

export interface AppState {
  config: Config;
  players: Player[];
  currentStep: number;
}

export const STORAGE_KEY = "captain-calc-state-v2";
export const STORAGE_VERSION = 2;
