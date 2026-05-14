"use client";
import { useEffect, useMemo, useState } from "react";
import { formatTL } from "../lib/format";
import { Card, Field, NumberInput, Select } from "./ui/Field";

type PlayoffRounds = "0" | "1" | "2" | "3" | "4" | "5";
type PostSeasonFormat =
  | "none"
  | "playoff"
  | "final-four"
  | "playoff-final-four";

const PLAYERS_PER_MATCH = 2;
const FINAL_FOUR_SERIES = 3;
const DEFAULT_LEAGUE_FEE = 0;
const DEFAULT_TEAM_COUNT = 10;
const DEFAULT_SERIES_MATCHES = 8;
const DEFAULT_PLAYOFF_ROUNDS: PlayoffRounds = "0";
const DEFAULT_POST_SEASON_FORMAT: PostSeasonFormat = "final-four";
const DEFAULT_PLAYS_FINAL = false;
export const SEASON_PLANNER_STORAGE_KEY = "captain-calculation-season-planner-v1";

const POST_SEASON_OPTIONS: {
  value: PostSeasonFormat;
  label: string;
  description: string;
}[] = [
  {
    value: "none",
    label: "Yok",
    description: "Sadece lig aşaması",
  },
  {
    value: "playoff",
    label: "Sadece Eleme Turu",
    description: "Final four yoksa veya final four öncesi elenirseniz",
  },
  {
    value: "final-four",
    label: "Sadece Final Four",
    description: "3 final four serisi",
  },
  {
    value: "playoff-final-four",
    label: "Eleme Turu + Final Four",
    description: "Eleme serileri + 3 final four serisi",
  },
];

interface StoredSeasonPlannerState {
  leagueFee: number;
  teamCount: number;
  seriesMatches: number;
  playoffRounds: PlayoffRounds;
  postSeasonFormat: PostSeasonFormat;
  playsFinal: boolean;
}

export function clearSeasonPlannerState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SEASON_PLANNER_STORAGE_KEY);
}

function loadSeasonPlannerState(): StoredSeasonPlannerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SEASON_PLANNER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSeasonPlannerState>;
    return {
      leagueFee: toSafeNumber(parsed.leagueFee, DEFAULT_LEAGUE_FEE, 0),
      teamCount: toSafeNumber(parsed.teamCount, DEFAULT_TEAM_COUNT, 2),
      seriesMatches: toSafeNumber(parsed.seriesMatches, DEFAULT_SERIES_MATCHES, 1),
      playoffRounds: normalizePlayoffRounds(parsed.playoffRounds),
      postSeasonFormat: normalizePostSeasonFormat(parsed.postSeasonFormat),
      playsFinal:
        typeof parsed.playsFinal === "boolean"
          ? parsed.playsFinal
          : DEFAULT_PLAYS_FINAL,
    };
  } catch {
    return null;
  }
}

function saveSeasonPlannerState(state: StoredSeasonPlannerState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEASON_PLANNER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

function toSafeNumber(value: unknown, fallback: number, min: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, value)
    : fallback;
}

function normalizePlayoffRounds(value: unknown): PlayoffRounds {
  return value === "1" ||
    value === "2" ||
    value === "3" ||
    value === "4" ||
    value === "5"
    ? value
    : DEFAULT_PLAYOFF_ROUNDS;
}

function normalizePostSeasonFormat(value: unknown): PostSeasonFormat {
  return value === "none" ||
    value === "playoff" ||
    value === "final-four" ||
    value === "playoff-final-four"
    ? value
    : DEFAULT_POST_SEASON_FORMAT;
}

export function SeasonPlanner() {
  const [leagueFee, setLeagueFee] = useState(DEFAULT_LEAGUE_FEE);
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT);
  const [seriesMatches, setSeriesMatches] = useState(DEFAULT_SERIES_MATCHES);
  const [playoffRounds, setPlayoffRounds] = useState<PlayoffRounds>(DEFAULT_PLAYOFF_ROUNDS);
  const [postSeasonFormat, setPostSeasonFormat] = useState<PostSeasonFormat>(
    DEFAULT_POST_SEASON_FORMAT,
  );
  const [playsFinal, setPlaysFinal] = useState(DEFAULT_PLAYS_FINAL);
  const [loaded, setLoaded] = useState(false);
  const hasPlayoff =
    postSeasonFormat === "playoff" || postSeasonFormat === "playoff-final-four";
  const hasFinalFour =
    postSeasonFormat === "final-four" ||
    postSeasonFormat === "playoff-final-four";
  const canPlayFinal = hasFinalFour;

  useEffect(() => {
    const stored = loadSeasonPlannerState();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLeagueFee(stored.leagueFee);
      setTeamCount(stored.teamCount);
      setSeriesMatches(stored.seriesMatches);
      setPlayoffRounds(stored.playoffRounds);
      setPostSeasonFormat(stored.postSeasonFormat);
      setPlaysFinal(stored.playsFinal);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveSeasonPlannerState({
      leagueFee,
      teamCount,
      seriesMatches,
      playoffRounds,
      postSeasonFormat,
      playsFinal,
    });
  }, [
    loaded,
    leagueFee,
    teamCount,
    seriesMatches,
    playoffRounds,
    postSeasonFormat,
    playsFinal,
  ]);

  const result = useMemo(() => {
    const regularSeasonSeries = Math.max(0, Math.floor(teamCount) - 1);
    const playoffSeries = hasPlayoff ? Number(playoffRounds) : 0;
    const finalFourSeries = hasFinalFour ? FINAL_FOUR_SERIES : 0;
    const finalSeries = canPlayFinal && playsFinal ? 1 : 0;
    const totalSeries =
      regularSeasonSeries + playoffSeries + finalFourSeries + finalSeries;
    const totalTeamMatches = totalSeries * Math.max(0, seriesMatches);
    const totalPlayerMatches = totalTeamMatches * PLAYERS_PER_MATCH;
    const pricePerPlayerMatch =
      totalPlayerMatches > 0 ? leagueFee / totalPlayerMatches : 0;

    return {
      regularSeasonSeries,
      playoffSeries,
      finalFourSeries,
      finalSeries,
      totalSeries,
      totalTeamMatches,
      totalPlayerMatches,
      pricePerPlayerMatch,
    };
  }, [
    leagueFee,
    teamCount,
    seriesMatches,
    playoffRounds,
    hasPlayoff,
    hasFinalFour,
    canPlayFinal,
    playsFinal,
  ]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-5">
        <Card title="Sezon Bilgileri">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Lig Ücreti (TL)" required>
              <NumberInput value={leagueFee} onChange={setLeagueFee} min={0} />
            </Field>
            <Field label="Toplam Takım" required>
              <NumberInput value={teamCount} onChange={setTeamCount} min={2} />
            </Field>
            <Field label="Seri Başına Maç" required>
              <NumberInput
                value={seriesMatches}
                onChange={setSeriesMatches}
                min={1}
              />
            </Field>
          </div>
        </Card>

        <Card title="Takım Yolu">
          <div className="grid gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-700 mb-2">
                Takımınızın olası sezon yolunu seçin
              </div>
              <div className="grid gap-1.5">
                {POST_SEASON_OPTIONS.map((option) => (
                  <FormatOption
                    key={option.value}
                    option={option}
                    selected={postSeasonFormat === option.value}
                    onSelect={() => {
                      setPostSeasonFormat(option.value);
                      if (
                        (option.value === "playoff" ||
                          option.value === "playoff-final-four") &&
                        playoffRounds === "0"
                      ) {
                        setPlayoffRounds("1");
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {hasPlayoff && (
              <div className="max-w-[260px]">
                <Field
                  label="Eleme turu"
                  hint={
                    postSeasonFormat === "playoff"
                      ? "Eleme yolunda oynanacak seri sayısı."
                      : "Final four öncesi oynanacak eleme serisi sayısı."
                  }
                >
                  <Select
                    value={playoffRounds}
                    onChange={setPlayoffRounds}
                    options={[
                      { value: "1", label: "1 tur" },
                      { value: "2", label: "2 tur" },
                      { value: "3", label: "3 tur" },
                      { value: "4", label: "4 tur" },
                      { value: "5", label: "5 tur" },
                    ]}
                  />
                </Field>
              </div>
            )}

            {canPlayFinal && (
              <FinalToggle checked={playsFinal} onChange={setPlaysFinal} />
            )}

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Yol Özeti
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PathChip label="Lig aşaması" value={`${result.regularSeasonSeries} seri`} />
                {result.playoffSeries > 0 && (
                  <PathChip label="Eleme turu" value={`${result.playoffSeries} seri`} />
                )}
                {result.finalFourSeries > 0 && (
                  <PathChip label="Final four" value={`${result.finalFourSeries} seri`} />
                )}
                {result.finalSeries > 0 && (
                  <PathChip label="Final" value={`${result.finalSeries} seri`} />
                )}
              </div>
              <div className="mt-3 text-sm text-zinc-600">
                Toplam {result.totalSeries} seri, {result.totalPlayerMatches} oyuncu-maç.
              </div>
            </div>
          </div>
        </Card>

        <Card title="Seri Dağılımı">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-zinc-500 border-b border-zinc-200">
                  <th className="py-2.5 px-2 font-medium">Aşama</th>
                  <th className="py-2.5 px-2 font-medium text-right">Seri</th>
                  <th className="py-2.5 px-2 font-medium text-right">
                    Takım Maçı
                  </th>
                  <th className="py-2.5 px-2 font-medium text-right">
                    Oyuncu-Maç
                  </th>
                </tr>
              </thead>
              <tbody>
                <BreakdownRow
                  label="Lig aşaması"
                  series={result.regularSeasonSeries}
                  seriesMatches={seriesMatches}
                />
                <BreakdownRow
                  label="Eleme turu"
                  series={result.playoffSeries}
                  seriesMatches={seriesMatches}
                />
                <BreakdownRow
                  label="Final four"
                  series={result.finalFourSeries}
                  seriesMatches={seriesMatches}
                />
                <BreakdownRow
                  label="Final"
                  series={result.finalSeries}
                  seriesMatches={seriesMatches}
                />
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 font-semibold text-zinc-900">
                  <td className="py-3 px-2">Toplam</td>
                  <td className="py-3 px-2 text-right tabular-nums">
                    {result.totalSeries}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">
                    {result.totalTeamMatches}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">
                    {result.totalPlayerMatches}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      <aside className="grid gap-5 content-start">
        <Card title="Maç Başı Ücret">
          <div className="text-3xl font-semibold tabular-nums text-zinc-900">
            {formatTL(result.pricePerPlayerMatch)}
          </div>
          <div className="mt-2 text-xs text-zinc-500 leading-relaxed">
            {formatTL(leagueFee)} / {result.totalPlayerMatches || 0} oyuncu-maç
          </div>
        </Card>

        <Card title="Formül">
          <div className="grid gap-3 text-sm">
            <FormulaLine label="Lig serisi" value={`${teamCount} - 1 = ${result.regularSeasonSeries}`} />
            <FormulaLine label="Toplam seri" value={String(result.totalSeries)} />
            <FormulaLine
              label="Oyuncu-maç"
              value={`${result.totalSeries} × ${seriesMatches || 0} × ${PLAYERS_PER_MATCH} = ${result.totalPlayerMatches}`}
            />
            <FormulaLine
              label="Ücret"
              value={`${formatTL(leagueFee)} / ${result.totalPlayerMatches || 0}`}
            />
          </div>
        </Card>
      </aside>
    </div>
  );
}

function FormatOption({
  option,
  selected,
  onSelect,
}: {
  option: {
    value: PostSeasonFormat;
    label: string;
    description: string;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-lg border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
          : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="grid min-w-0 gap-0.5 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
          <span className="text-sm font-semibold">{option.label}</span>
          <span
            className={`text-xs leading-relaxed ${
              selected ? "text-zinc-200" : "text-zinc-500"
            }`}
          >
            {option.description}
          </span>
        </span>
        <span
          className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
            selected ? "bg-white" : "bg-zinc-200"
          }`}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

function FinalToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`rounded-lg border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
        checked
          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
          : "border-red-300 bg-red-50 text-red-950 hover:border-red-400 hover:bg-red-100"
      }`}
    >
      <span className="flex items-start justify-between gap-4">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">
            Final oynar
          </span>
          <span
            className={`mt-1 block text-xs leading-relaxed ${
              checked ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {checked
              ? "Final four sonrası şampiyonluk maçı için 1 seri daha eklenir."
              : "Final serisi hesaba katılmaz."}
          </span>
        </span>
        <span
          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
            checked
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-red-500 bg-red-500 text-white"
          }`}
          aria-hidden="true"
        >
          {checked ? "✓" : "×"}
        </span>
      </span>
    </button>
  );
}

function PathChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm">
      <span className="font-medium text-zinc-800">{label}</span>
      <span className="text-zinc-500 tabular-nums">{value}</span>
    </span>
  );
}

function BreakdownRow({
  label,
  series,
  seriesMatches,
}: {
  label: string;
  series: number;
  seriesMatches: number;
}) {
  const teamMatches = series * Math.max(0, seriesMatches);
  const playerMatches = teamMatches * PLAYERS_PER_MATCH;
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="py-3 px-2 text-zinc-700">{label}</td>
      <td className="py-3 px-2 text-right tabular-nums text-zinc-900">
        {series}
      </td>
      <td className="py-3 px-2 text-right tabular-nums text-zinc-900">
        {teamMatches}
      </td>
      <td className="py-3 px-2 text-right tabular-nums text-zinc-900">
        {playerMatches}
      </td>
    </tr>
  );
}

function FormulaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 last:border-0 pb-2 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900 tabular-nums text-right">
        {value}
      </span>
    </div>
  );
}
