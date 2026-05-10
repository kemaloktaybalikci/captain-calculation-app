"use client";
import { useEffect, useState } from "react";
import type { CalcStateApi } from "../../hooks/useCalcState";
import { calculate, settle } from "../../lib/algorithm";
import { formatTL } from "../../lib/format";
import { Button, Card } from "../ui/Field";
import type {
  CalculationResult,
  SettlementResult,
} from "../../lib/types";

interface ComputedResult {
  calc: CalculationResult;
  settlement: SettlementResult;
}

const COMPUTE_DELAY_MS = 350;

export function Step3Compute({
  api,
  onGoToStep,
}: {
  api: CalcStateApi;
  onGoToStep: (step: number) => void;
}) {
  const { state } = api;
  const [result, setResult] = useState<ComputedResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string>("");

  useEffect(() => {
    if (state.players.length === 0) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComputing(true);
    setResult(null);
    const timer = setTimeout(() => {
      if (cancelled) return;
      const calc = calculate(state.config, state.players);
      const settlement = settle(state.config, calc);
      setResult({ calc, settlement });
      setComputing(false);
    }, COMPUTE_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.config, state.players]);

  if (state.players.length === 0) {
    return <EmptyState onGoToStep={onGoToStep} />;
  }

  const handleExport = async () => {
    if (!result) return;
    setExportError("");
    setExporting(true);
    try {
      const { exportResultsToExcel } = await import("../../lib/excel");
      await exportResultsToExcel({
        config: state.config,
        players: state.players,
        calc: result.calc,
        settlement: result.settlement,
      });
    } catch (e) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  if (computing || !result) {
    return <ComputingState />;
  }

  return (
    <ResultsView
      result={result}
      exporting={exporting}
      exportError={exportError}
      onExport={handleExport}
    />
  );
}

function EmptyState({ onGoToStep }: { onGoToStep: (step: number) => void }) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center py-10 px-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-500"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-zinc-900">
          Kadro henüz boş
        </h3>
        <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
          Hesaplamayı görebilmek için önce oyuncuları eklemen gerek. Excel
          yükleyebilir veya tek tek isim girebilirsin.
        </p>
        <div className="mt-5 flex gap-2">
          <Button onClick={() => onGoToStep(0)}>Kadroya geç</Button>
          <Button variant="ghost" onClick={() => onGoToStep(1)}>
            Genel ayarlar
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ComputingState() {
  return (
    <Card>
      <div className="flex items-center gap-4 py-4">
        <div className="text-sm font-medium text-zinc-700">
          Hesaplanıyor…
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full w-1/3 bg-zinc-900 rounded-full progress-indeterminate" />
        </div>
      </div>
    </Card>
  );
}

function ResultsView({
  result,
  exporting,
  exportError,
  onExport,
}: {
  result: ComputedResult;
  exporting: boolean;
  exportError: string;
  onExport: () => void;
}) {
  const { calc, settlement } = result;
  const kasaState =
    Math.abs(calc.kasaBalance) <= 0.5
      ? "balanced"
      : calc.kasaBalance > 0
        ? "surplus"
        : "deficit";

  return (
    <div className="grid gap-4 step-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Sonuç
          </div>
          <div className="text-xl font-semibold text-zinc-900">
            Maç Başı Pay
          </div>
        </div>
        <div className="flex items-center gap-3">
          {exportError && (
            <span className="text-xs text-red-600">
              {exportError}
            </span>
          )}
          <Button onClick={onExport} disabled={exporting}>
            {exporting ? "Hazırlanıyor…" : "Excel İndir"}
          </Button>
        </div>
      </div>

      {calc.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-medium text-amber-900 mb-1">
            Uyarı
          </div>
          <ul className="text-xs text-amber-800 list-disc pl-5 space-y-0.5">
            {calc.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Maç Birim" value={formatTL(calc.costPerMatch)} />
        <Stat
          label="Toplam Pay"
          value={formatTL(calc.totalShareDistributed)}
        />
        <Stat
          label="Toplam Avans"
          value={formatTL(
            calc.perPlayer.reduce((s, r) => s + r.advance, 0),
          )}
        />
        <Stat
          label="Kasa Bakiyesi"
          value={formatTL(calc.kasaBalance)}
          tone={
            kasaState === "balanced"
              ? "ok"
              : kasaState === "surplus"
                ? "warn"
                : "danger"
          }
          hint={
            kasaState === "balanced"
              ? "Dengede"
              : kasaState === "surplus"
                ? "Artık var"
                : "Açık"
          }
        />
      </div>

      <Card title="Oyuncular">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-zinc-500 border-b border-zinc-200">
                <th className="py-2.5 px-2 font-medium text-right w-1">#</th>
                <th className="py-2.5 px-2 font-medium">Ad</th>
                <th className="py-2.5 px-2 font-medium text-right">Maç</th>
                <th className="py-2.5 px-2 font-medium text-right">İlk Ücret</th>
                <th className="py-2.5 px-2 font-medium text-right">Pay</th>
                <th className="py-2.5 px-2 font-medium text-right">Net</th>
                <th className="py-2.5 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {calc.perPlayer.map((r, idx) => (
                <tr
                  key={r.playerId}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors"
                >
                  <td className="py-3 px-2 text-right tabular-nums text-zinc-400">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium text-zinc-900">
                      {r.name}
                    </div>
                    {(r.exempt || r.notes.length > 0) && (
                      <div className="text-xs text-zinc-500 mt-0.5 flex gap-1.5 flex-wrap items-center">
                        {r.exempt && <Badge tone="muted">muaf</Badge>}
                        {r.notes.length > 0 && !r.exempt && (
                          <span>{r.notes.join(" · ")}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums text-zinc-700">
                    {r.matches}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums text-zinc-900">
                    {formatTL(r.advance)}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums text-zinc-600">
                    {formatTL(r.share)}
                  </td>
                  <td
                    className={`py-3 px-2 text-right tabular-nums font-semibold ${
                      r.finalNet > 0.5
                        ? "text-emerald-700"
                        : r.finalNet < -0.5
                          ? "text-red-700"
                          : "text-zinc-400"
                    }`}
                  >
                    {formatTL(r.finalNet)}
                  </td>
                  <td className="py-3 px-2 w-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        r.finalNet > 0.5
                          ? "bg-emerald-500"
                          : r.finalNet < -0.5
                            ? "bg-red-500"
                            : "bg-zinc-300"
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {settlement.mode === "kasa" ? (
        <Card title="Mahsup — Kasa Hareketleri">
          <div className="grid gap-5 md:grid-cols-2">
            <FlowList
              title="Kasaya Ödeyecekler"
              items={settlement.kasaInflows.map((t) => ({
                left: t.from,
                amount: t.amount,
              }))}
              tone="negative"
              emptyText="Borçlu yok"
            />
            <FlowList
              title="Kasadan Alacaklılar"
              items={settlement.kasaOutflows.map((t) => ({
                left: t.to,
                amount: t.amount,
              }))}
              tone="positive"
              emptyText="Alacaklı yok"
            />
          </div>
        </Card>
      ) : (
        <Card title="Mahsup — Peer-to-Peer">
          {settlement.p2pTransfers.length === 0 ? (
            <div className="text-sm text-zinc-500 py-4">
              Hiç transfer gerekmiyor.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {settlement.p2pTransfers.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-red-700 font-medium">
                      {t.from}
                    </span>
                    <span className="text-zinc-400">→</span>
                    <span className="text-emerald-700 font-medium">
                      {t.to}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-zinc-900">
                    {formatTL(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {Math.abs(calc.kasaBalance) > 0.5 && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Peer-to-peer mahsuplaşma sonrası kasada{" "}
              <span className="font-semibold">
                {formatTL(calc.kasaBalance)}
              </span>{" "}
              bakiye kalıyor.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const valueCls =
    tone === "warn"
      ? "text-amber-700"
      : tone === "danger"
        ? "text-red-700"
        : tone === "ok"
          ? "text-emerald-700"
          : "text-zinc-900";
  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`text-lg font-semibold mt-1 tabular-nums ${valueCls}`}
      >
        {value}
      </div>
      {hint && (
        <div className="text-xs text-zinc-500 mt-0.5">
          {hint}
        </div>
      )}
    </div>
  );
}

function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "warn";
}) {
  const cls =
    tone === "warn"
      ? "bg-amber-100 text-amber-800"
      : "bg-zinc-100 text-zinc-600";
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function FlowList({
  title,
  items,
  tone,
  emptyText,
}: {
  title: string;
  items: { left: string; amount: number }[];
  tone: "positive" | "negative";
  emptyText: string;
}) {
  const amountCls =
    tone === "positive"
      ? "text-emerald-700"
      : "text-red-700";
  return (
    <div>
      <div className="text-xs uppercase font-medium text-zinc-500 mb-2">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-zinc-400">
          {emptyText}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex justify-between items-center py-2 text-sm"
            >
              <span className="text-zinc-700">
                {it.left}
              </span>
              <span className={`font-semibold tabular-nums ${amountCls}`}>
                {formatTL(it.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
