export type CalcMode = "per-match" | "base-rate";

export type SettlementMode = "kasa" | "p2p";

export interface Player {
  id: string;
  name: string;
  matches: number;
  advance: number;
  exempt: boolean;
}

export interface Config {
  calcMode: CalcMode;
  leagueFee: number;
  sponsorContribution: number;
  baseRatePercent: number;
  settlementMode: SettlementMode;
}

export interface PlayerResult {
  playerId: string;
  name: string;
  matches: number;
  advance: number;
  exempt: boolean;
  share: number;
  baseShare: number;
  matchShare: number;
  net: number;
  finalNet: number;
  notes: string[];
}

export interface CalculationResult {
  mode: CalcMode;
  perPlayer: PlayerResult[];
  costPerMatch: number;
  totalShareDistributed: number;
  totalBaseShare: number;
  baseRatePercent: number;
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

export const STORAGE_KEY = "captain-calc-state-v3";
export const STORAGE_VERSION = 3;
export const DEFAULT_BASE_RATE_PERCENT = 40;
export const BASE_RATE_STEP = 5;
export const BASE_RATE_MIN = 0;
export const BASE_RATE_MAX = 100;
