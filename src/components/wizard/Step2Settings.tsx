"use client";
import type { CalcStateApi } from "../../hooks/useCalcState";
import { Card, Field, NumberInput } from "../ui/Field";
import { formatTL } from "../../lib/format";

export function Step2Settings({ api }: { api: CalcStateApi }) {
  const { state, setConfig } = api;
  const c = state.config;

  const totalAdvance = state.players.reduce((s, p) => s + p.advance, 0);
  const collectedPlusSponsor = totalAdvance + c.sponsorContribution;
  const netDiff = collectedPlusSponsor - c.leagueFee;
  const lDist = c.leagueFee - c.sponsorContribution;
  const M_nonExempt = state.players
    .filter((p) => !p.exempt)
    .reduce((s, p) => s + p.matches, 0);
  const autoCostPerMatch = M_nonExempt > 0 ? lDist / M_nonExempt : 0;
  const settingsInvalid = c.leagueFee > 0 && Math.abs(netDiff) >= 0.5;
  const netTone =
    c.leagueFee === 0 ? "neutral" : settingsInvalid ? "warn" : "ok";

  return (
    <div className="grid gap-5">
      <Card title="Hesaplama Modu">
        <div className="grid gap-3 md:grid-cols-2">
          <ModeOption
            checked
            title="Maç Başı Pay"
            desc="Toplanan + sponsor = lig ücreti olmalı. Lig ücreti, muaf olmayanların maçlarına bölünür. Σ net = 0."
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
              <ReadOnlyAmount value={netDiff} tone={netTone} />
            </Field>
            <Field label="Dağıtılacak (Lig − Sponsor)">
              <ReadOnlyAmount value={lDist} />
            </Field>
            {settingsInvalid && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Toplanan + sponsor, lig ücretine eşit olmalı. Aksi halde
                hesaplama yapılamaz.
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
