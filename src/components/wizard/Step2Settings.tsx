"use client";
import type { CalcStateApi } from "../../hooks/useCalcState";
import { Card, Field, NumberInput, Select } from "../ui/Field";
import { formatTL } from "../../lib/format";

export function Step2Settings({ api }: { api: CalcStateApi }) {
  const { state, setConfig, setTolerance } = api;
  const c = state.config;

  const totalAdvance = state.players.reduce((s, p) => s + p.advance, 0);
  const collectedPlusSponsor = totalAdvance + c.sponsorContribution;
  const lDist = c.leagueFee - c.sponsorContribution;
  const M_nonExempt = state.players
    .filter((p) => !p.exempt)
    .reduce((s, p) => s + p.matches, 0);
  const autoCostPerMatch = M_nonExempt > 0 ? lDist / M_nonExempt : 0;
  const fullSettlementMatches =
    Math.abs(collectedPlusSponsor - c.leagueFee) < 0.5;

  return (
    <div className="grid gap-5">
      <Card title="Hesaplama Modu">
        <div className="grid gap-3 md:grid-cols-2">
          <ModeOption
            checked={c.topMode === "full-settlement"}
            onChange={() => setConfig({ topMode: "full-settlement" })}
            title="Tam Mahsup"
            desc="Toplanan + sponsor = lig ücreti olmalı. Lig ücreti, muaf olmayanların maçlarına bölünür. Σ net = 0."
          />
          <ModeOption
            checked={c.topMode === "per-match"}
            onChange={() => setConfig({ topMode: "per-match" })}
            title="Maç Başı"
            desc="Maç başı bedel manuel girilir. Kasada artık para kalabilir. Tolerans uygulanabilir."
          />
        </div>
      </Card>

      <Card title="Para Akışı">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <Field label="Toplanan (Excel'den)">
              <ReadOnlyAmount value={totalAdvance} />
            </Field>
            <Field label="Lig Ücreti (TL)" required>
              <NumberInput
                value={c.leagueFee}
                onChange={(v) => setConfig({ leagueFee: v })}
                min={0}
              />
            </Field>
            <Field label="Sponsor / Ek Ödeme (TL)" hint="Lig ücretinden düşer.">
              <NumberInput
                value={c.sponsorContribution}
                onChange={(v) => setConfig({ sponsorContribution: v })}
                min={0}
              />
            </Field>
          </div>
          <div className="grid gap-3 content-start">
            <Field label="Net (Toplanan + Sponsor − Lig)">
              <ReadOnlyAmount
                value={collectedPlusSponsor - c.leagueFee}
                tone={
                  Math.abs(collectedPlusSponsor - c.leagueFee) < 0.5
                    ? "ok"
                    : "warn"
                }
              />
            </Field>
            <Field label="Dağıtılacak (Lig − Sponsor)">
              <ReadOnlyAmount value={lDist} />
            </Field>
            {c.topMode === "full-settlement" && !fullSettlementMatches && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Tam Mahsup&apos;ta toplanan + sponsor, lig ücretine eşit
                olmalı. Aksi halde kasada açık/fazla kalır.
              </div>
            )}
            {c.topMode === "full-settlement" && M_nonExempt > 0 && (
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

      {c.topMode === "per-match" && (
        <Card title="Maç Başı Ayarları">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Maç Başı Bedel (TL)" required>
              <NumberInput
                value={c.costPerMatch}
                onChange={(v) => setConfig({ costPerMatch: v })}
                min={0}
              />
            </Field>
            <Field
              label="WO Sayısı"
              hint="WO maliyeti muaf olmayan oyunculara eşit dağılır."
            >
              <NumberInput
                value={c.woCount}
                onChange={(v) => setConfig({ woCount: v })}
                min={0}
              />
            </Field>
            <Field label="Tolerans Türü">
              <Select
                value={c.tolerance.type}
                onChange={(v) => setTolerance({ type: v })}
                options={[
                  { value: "none", label: "Yok" },
                  { value: "matches", label: "Maç bandı (beklenen ± X)" },
                  { value: "money", label: "Para eşiği (|net| ≤ X)" },
                ]}
              />
            </Field>
            {c.tolerance.type === "matches" && (
              <Field
                label="Maç Bant Genişliği (±)"
                hint={`Beklenen = avans / maç bedeli. ${
                  c.costPerMatch > 0
                    ? `Örn: 3,5 ± ${c.tolerance.matchBand} → bant [${(3.5 - c.tolerance.matchBand).toFixed(1)}, ${(3.5 + c.tolerance.matchBand).toFixed(1)}]`
                    : ""
                }`}
              >
                <NumberInput
                  value={c.tolerance.matchBand}
                  onChange={(v) => setTolerance({ matchBand: v })}
                  min={0}
                  step={0.5}
                />
              </Field>
            )}
            {c.tolerance.type === "money" && (
              <Field label="Para Eşiği (TL)">
                <NumberInput
                  value={c.tolerance.moneyThreshold}
                  onChange={(v) => setTolerance({ moneyThreshold: v })}
                  min={0}
                />
              </Field>
            )}
            <Field
              label="Minimum Giriş Ücreti (TL)"
              hint="Hiç oynamamış ama avans vermiş oyunculardan kesilir."
            >
              <NumberInput
                value={c.minRegistrationFee}
                onChange={(v) => setConfig({ minRegistrationFee: v })}
                min={0}
              />
            </Field>
          </div>
        </Card>
      )}

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

function ModeOption({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-md border cursor-pointer transition ${
        checked
          ? "bg-zinc-900 text-white border-zinc-900"
          : "bg-white border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
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
