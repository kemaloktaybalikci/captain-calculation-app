"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState, Config, Player } from "../lib/types";
import { defaultState } from "../lib/defaults";
import { loadState, saveState } from "../lib/storage";

const SAVE_DEBOUNCE_MS = 150;

export interface CalcStateApi {
  state: AppState;
  loaded: boolean;
  setConfig: (patch: Partial<Config>) => void;
  setPlayers: (next: Player[]) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  setStep: (step: number) => void;
  reset: () => void;
}

export function useCalcState(): CalcStateApi {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setLoaded(true);
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current !== null) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(state);
      saveTimer.current = null;
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current !== null) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [state, loaded]);

  const setConfig = useCallback(
    (patch: Partial<Config>) =>
      setState((s) => ({ ...s, config: { ...s.config, ...patch } })),
    [],
  );
  const setPlayers = useCallback(
    (next: Player[]) => setState((s) => ({ ...s, players: next })),
    [],
  );
  const addPlayer = useCallback(
    (player: Player) =>
      setState((s) => ({ ...s, players: [player, ...s.players] })),
    [],
  );
  const updatePlayer = useCallback(
    (id: string, patch: Partial<Player>) =>
      setState((s) => ({
        ...s,
        players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
    [],
  );
  const removePlayer = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        players: s.players.filter((p) => p.id !== id),
      })),
    [],
  );
  const setStep = useCallback(
    (step: number) => setState((s) => ({ ...s, currentStep: step })),
    [],
  );
  const reset = useCallback(() => setState(defaultState), []);

  return {
    state,
    loaded,
    setConfig,
    setPlayers,
    addPlayer,
    updatePlayer,
    removePlayer,
    setStep,
    reset,
  };
}
