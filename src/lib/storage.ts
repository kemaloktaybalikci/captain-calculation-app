import type { AppState, CalcMode, Config } from "./types";
import {
  BASE_RATE_MAX,
  BASE_RATE_MIN,
  STORAGE_KEY,
  STORAGE_VERSION,
} from "./types";
import { defaultState } from "./defaults";

interface StoredEnvelope {
  version: number;
  state: AppState;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const env = JSON.parse(raw) as StoredEnvelope;
    if (!env || env.version !== STORAGE_VERSION) return defaultState;
    return mergeWithDefaults(env.state);
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    const env: StoredEnvelope = { version: STORAGE_VERSION, state };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
  } catch {
    /* ignore quota errors */
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function mergeWithDefaults(state: Partial<AppState> | undefined): AppState {
  if (!state) return defaultState;
  const cfg = (state.config ?? {}) as Partial<Config>;
  const calcMode: CalcMode =
    cfg.calcMode === "base-rate" ? "base-rate" : "per-match";
  const rawRate =
    typeof cfg.baseRatePercent === "number" && Number.isFinite(cfg.baseRatePercent)
      ? cfg.baseRatePercent
      : defaultState.config.baseRatePercent;
  const baseRatePercent = Math.max(BASE_RATE_MIN, Math.min(BASE_RATE_MAX, rawRate));
  return {
    config: {
      ...defaultState.config,
      ...cfg,
      calcMode,
      baseRatePercent,
      sponsorContribution: calcMode === "base-rate" ? 0 : (cfg.sponsorContribution ?? 0),
    },
    players: (state.players ?? []).map((p) => ({
      id: p.id,
      name: p.name ?? "",
      matches: p.matches ?? 0,
      advance: p.advance ?? 0,
      exempt: p.exempt ?? false,
    })),
    currentStep: Math.max(0, Math.min(2, state.currentStep ?? 0)),
  };
}
