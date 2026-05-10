"use client";
import type { CalcStateApi } from "../../hooks/useCalcState";
import { Card, Field, NumberInput } from "../ui/Field";
import { formatTL } from "../../lib/format";
import {
  BASE_RATE_MAX,
  BASE_RATE_MIN,
  BASE_RATE_STEP,
  type CalcMode,
} from "../../lib/types";

export function Step2Settings({ api }: { api: CalcStateApi }) {
  const { state, setConfig } = api;
  const c = state.config;
  const isBaseRate = c.calcMode === "base-rate";

  const totalAdvance = state.players.reduce((s, p) => s + p.advance, 0);
  const collectedPlusSponsor = totalAdvance + c.sponsorContribution;
  const netDiff = isBaseRate
    ? totalAdvance - c.leagueFee
    : collectedPlusSponsor - c.leagueFee;
  const lDist = isBaseRate
    ? c.leagueFee
    : c.leagueFee - c.sponsorContribution;
  const M_nonExempt = state.players
    .filter((p) => !p.exempt)
    .reduce((s, p) => s + p.matches, 0);

  const baseRate = clampRate(c.baseRatePercent) / 100;
  const baseFixedTotal = isBaseRate
    ? state.players
        .filter((p) => !p.exempt)
        .reduce((s, p) => s + p.advance * baseRate, 0)
    : 0;
  const distributable = isBaseRate ? c.leagueFee - baseFixedTotal : lDist;
  const autoCostPerMatch =
    M_nonExempt > 0 ? Math.max(0, distributable) / M_nonExempt : 0;
  const settingsInvalid = c.leagueFee > 0 && Math.abs(netDiff) >= 0.5;
  const netTone =
    c.leagueFee === 0 ? "neutral" : settingsInvalid ? "warn" : "ok";

  const setMode = (mode: CalcMode) => {
    if (mode === "base-rate") {
      setConfig({ calcMode: mode, sponsorContribution: 0 });
    } else {
      setConfig({ calcMode: mode });
    }
  };

  return (
    <div className="grid gap-5">
      <Card title="Hesaplama Modu">
        <div className="grid gap-3 md:grid-cols-2">
          <ModeOption
            checked={c.calcMode === "per-match"}
            onChange={() => setMode("per-match")}
            title="Maç Başı Pay"
            desc="Toplanan + sponsor = lig ücreti olmalı. Lig ücreti, muaf olmayanların maçlarına bölünür. Σ net = 0."
          />
          <ModeOption
            checked={c.calcMode === "base-rate"}
            onChange={() => setMode("base-rate")}
            title="Baz Oranlı Pay"
            desc="Her oyuncunun verdiği paranın belirlenen yüzdesi sabit kalır. Kalan tutar maç sayılarına bölünür."
          />
        </div>
      </Card>

      <Card title="Para Akışı">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <Field
              label="Toplanan"
              tooltip="Kadro sayfasındaki ilk ücretlerin toplamı"
            >
              <ReadOnlyAmount value={totalAdvance} />
            </Field>
            <Field label="Lig Ücreti (TL)" required>
              <NumberInput
                value={c.leagueFee}
                onChange={(v) => setConfig({ leagueFee: v })}
                min={0}
              />
            </Field>
            {!isBaseRate && (
              <Field
                label="Sponsor / Ek Ödeme (TL)"
                hint="Lig ücretinden düşer."
              >
                <NumberInput
                  value={c.sponsorContribution}
                  onChange={(v) => setConfig({ sponsorContribution: v })}
                  min={0}
                />
              </Field>
            )}
            {isBaseRate && (
              <Field
                label="Baz Oran (%)"
                hint={`${BASE_RATE_MIN}–${BASE_RATE_MAX} arası, ${BASE_RATE_STEP}'lik adımla. Sonuç ekranındaki kaydırıcıyla geçici olarak da değiştirilebilir.`}
              >
                <BaseRateInput
                  value={clampRate(c.baseRatePercent)}
                  onChange={(v) => setConfig({ baseRatePercent: v })}
                />
              </Field>
            )}
          </div>
          <div className="grid gap-3 content-start">
            <Field
              label={
                isBaseRate
                  ? "Net (Toplanan − Lig)"
                  : "Net (Toplanan + Sponsor − Lig)"
              }
            >
              <ReadOnlyAmount value={netDiff} tone={netTone} />
            </Field>
            <Field
              label={
                isBaseRate
                  ? `Sabit Tutar (Toplanan × %${clampRate(c.baseRatePercent)})`
                  : "Dağıtılacak (Lig − Sponsor)"
              }
            >
              <ReadOnlyAmount value={isBaseRate ? baseFixedTotal : lDist} />
            </Field>
            {isBaseRate && (
              <Field label="Maçlara Dağıtılacak (Lig − Sabit)">
                <ReadOnlyAmount value={Math.max(0, distributable)} />
              </Field>
            )}
            {settingsInvalid && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                {isBaseRate
                  ? "Toplanan, lig ücretine eşit olmalı. Aksi halde dağılım tutmaz."
                  : "Toplanan + sponsor, lig ücretine eşit olmalı. Aksi halde hesaplama yapılamaz."}
              </div>
            )}
            {M_nonExempt > 0 && (
              <div className="text-xs text-zinc-500">
                Otomatik maç başı bedel:{" "}
                <span className="font-medium text-zinc-700">
                  {formatTL(autoCostPerMatch)}
                </span>{" "}
                ({M_nonExempt} muafsız maç)
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Mahsup Modu">
        <div className="grid gap-3 md:grid-cols-2">
          <ModeOption
            checked={c.settlementMode === "kasa"}
            onChange={() => setConfig({ settlementMode: "kasa" })}
            title="Kasa Merkezli"
            desc="Herkes kasayla mahsuplaşır. Kasaya öde / kasadan al listesi."
          />
          <ModeOption
            checked={c.settlementMode === "p2p"}
            onChange={() => setConfig({ settlementMode: "p2p" })}
            title="Peer-to-Peer"
            desc="Borçlu doğrudan alacaklıya gönderir. Minimum transfer."
          />
        </div>
      </Card>
    </div>
  );
}

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return BASE_RATE_MIN;
  return Math.max(BASE_RATE_MIN, Math.min(BASE_RATE_MAX, value));
}

function snapRate(value: number): number {
  const clamped = clampRate(value);
  return Math.round(clamped / BASE_RATE_STEP) * BASE_RATE_STEP;
}

function BaseRateInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={BASE_RATE_MIN}
        max={BASE_RATE_MAX}
        step={BASE_RATE_STEP}
        value={value}
        onChange={(e) => onChange(snapRate(Number(e.target.value)))}
        className="flex-1 accent-zinc-900"
        aria-label="Baz oran yüzdesi"
      />
      <div className="text-sm font-semibold tabular-nums text-zinc-900 w-12 text-right">
        %{value}
      </div>
    </div>
  );
}

function ModeOption({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange?: () => void;
  title: string;
  desc: string;
}) {
  const interactive = onChange !== undefined;
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-md border transition ${
        interactive ? "cursor-pointer" : ""
      } ${
        checked
          ? "bg-zinc-900 text-white border-zinc-900"
          : "bg-white border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange ?? (() => {})}
        readOnly={!interactive}
        className="mt-1"
      />
      <div>
        <div className="font-medium">{title}</div>
        <div
          className={`text-xs mt-1 ${
            checked
              ? "text-zinc-300"
              : "text-zinc-500"
          }`}
        >
          {desc}
        </div>
      </div>
    </label>
  );
}

function ReadOnlyAmount({
  value,
  tone = "neutral",
}: {
  value: number;
  tone?: "neutral" | "ok" | "warn";
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : tone === "warn"
        ? "bg-amber-50 border-amber-200 text-amber-800"
        : "bg-zinc-50 border-zinc-200 text-zinc-900";
  return (
    <div
      className={`text-base font-semibold rounded-md px-3 py-2 border tabular-nums ${cls}`}
    >
      {formatTL(value)}
    </div>
  );
}
