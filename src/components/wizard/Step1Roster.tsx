"use client";
import { memo, useRef, useState } from "react";
import type { CalcStateApi } from "../../hooks/useCalcState";
import { makePlayer } from "../../lib/defaults";
import {
  parseRosterExcel,
  generateRosterTemplate,
} from "../../lib/excel-import";
import { Button, Card, NumberInput, TextInput } from "../ui/Field";
import type { Player } from "../../lib/types";
import { formatTL } from "../../lib/format";

interface RowProps {
  player: Player;
  onUpdate: (id: string, patch: Partial<Player>) => void;
  onRemove: (id: string) => void;
}

const PlayerRow = memo(function PlayerRow({
  player,
  onUpdate,
  onRemove,
}: RowProps) {
  return (
    <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors group">
      <td className="py-2.5 px-2 min-w-[180px]">
        <TextInput
          value={player.name}
          onChange={(v) => onUpdate(player.id, { name: v })}
          className="border-transparent hover:border-zinc-300 bg-transparent group-hover:bg-white"
        />
      </td>
      <td className="py-2.5 px-2 max-w-[150px]">
        <NumberInput
          value={player.advance}
          onChange={(v) => onUpdate(player.id, { advance: v })}
          min={0}
          className="border-transparent hover:border-zinc-300 bg-transparent group-hover:bg-white text-right"
        />
      </td>
      <td className="py-2.5 px-2 max-w-[110px]">
        <NumberInput
          value={player.matches}
          onChange={(v) => onUpdate(player.id, { matches: v })}
          min={0}
          className="border-transparent hover:border-zinc-300 bg-transparent group-hover:bg-white text-right"
        />
      </td>
      <td className="py-2.5 px-2 text-center">
        <input
          type="checkbox"
          checked={player.exempt}
          onChange={(e) => onUpdate(player.id, { exempt: e.target.checked })}
          className="h-4 w-4 rounded border-zinc-300 cursor-pointer"
        />
      </td>
      <td className="py-2.5 px-2 w-1">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            player.exempt
              ? "bg-amber-400"
              : player.matches > 0
                ? "bg-emerald-500"
                : "bg-zinc-300"
          }`}
        />
      </td>
      <td className="py-2.5 pl-2 pr-1 text-right">
        <button
          onClick={() => onRemove(player.id)}
          className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition px-2 py-1 rounded"
          title="Sil"
        >
          Sil
        </button>
      </td>
    </tr>
  );
});

export function Step1Roster({ api }: { api: CalcStateApi }) {
  const { state, addPlayer, removePlayer, updatePlayer, setPlayers } = api;
  const [newName, setNewName] = useState("");
  const [importMessage, setImportMessage] = useState<{
    kind: "ok" | "warn" | "err";
    text: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addPlayer(makePlayer(trimmed));
    setNewName("");
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportMessage(null);
    try {
      const result = await parseRosterExcel(file);
      if (result.errors.length > 0) {
        setImportMessage({ kind: "err", text: result.errors.join("; ") });
        return;
      }
      if (state.players.length > 0) {
        if (
          !confirm(
            `Mevcut ${state.players.length} oyuncu silinip ${result.players.length} oyuncu yüklenecek. Devam edilsin mi?`,
          )
        ) {
          return;
        }
      }
      setPlayers(result.players);
      const text = `${result.players.length} oyuncu yüklendi.${
        result.warnings.length > 0
          ? ` Uyarı: ${result.warnings.join("; ")}`
          : ""
      }`;
      setImportMessage({
        kind: result.warnings.length > 0 ? "warn" : "ok",
        text,
      });
    } catch (e) {
      setImportMessage({
        kind: "err",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setImporting(false);
    }
  };

  const totalAdvance = state.players.reduce((s, p) => s + p.advance, 0);
  const totalMatches = state.players.reduce((s, p) => s + p.matches, 0);
  const exemptCount = state.players.filter((p) => p.exempt).length;
  const nonExemptMatches = state.players
    .filter((p) => !p.exempt)
    .reduce((s, p) => s + p.matches, 0);

  return (
    <div className="grid gap-5">
      <Card title="Excel'den Yükle">
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? "Yükleniyor…" : "Excel Yükle (.xlsx)"}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await generateRosterTemplate();
              } catch (e) {
                setImportMessage({ kind: "err", text: String(e) });
              }
            }}
          >
            Şablon indir
          </Button>
          <span className="text-xs text-zinc-500">
            Sütunlar:{" "}
            <span className="font-medium text-zinc-700">
              ad
            </span>
            {" · "}
            <span className="font-medium text-zinc-700">
              ilk ücret
            </span>
            {" · "}
            <span className="font-medium text-zinc-700">
              oyun sayısı
            </span>
            {" · "}
            <span className="font-medium text-zinc-700">
              muaf
            </span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
        </div>
        {importMessage && (
          <div
            className={`mt-3 text-xs ${
              importMessage.kind === "err"
                ? "text-red-600"
                : importMessage.kind === "warn"
                  ? "text-amber-600"
                  : "text-emerald-700"
            }`}
          >
            {importMessage.text}
          </div>
        )}
      </Card>

      <Card
        title={`Kadro · ${state.players.length} oyuncu${exemptCount > 0 ? `, ${exemptCount} muaf` : ""}`}
      >
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex-1 min-w-[200px]">
            <TextInput
              value={newName}
              onChange={setNewName}
              placeholder="Oyuncu ekle (isim)"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd}>+ Ekle</Button>
        </div>
        {state.players.length === 0 ? (
          <div className="text-sm text-zinc-500 py-8 text-center">
            Henüz oyuncu yok. Excel yükleyin veya yukarıdan tek tek ekleyin.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-zinc-500 border-b border-zinc-200">
                  <th className="py-2.5 px-2 font-medium">Ad</th>
                  <th className="py-2.5 px-2 font-medium text-right">
                    İlk Ücret (TL)
                  </th>
                  <th className="py-2.5 px-2 font-medium text-right">
                    Oyun Sayısı
                  </th>
                  <th className="py-2.5 px-2 font-medium text-center">Muaf</th>
                  <th className="py-2.5 px-2"></th>
                  <th className="py-2.5 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {state.players.map((p) => (
                  <PlayerRow
                    key={p.id}
                    player={p}
                    onUpdate={updatePlayer}
                    onRemove={removePlayer}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 text-sm">
                  <td className="py-3 px-2 text-xs uppercase tracking-wide text-zinc-500 font-medium">
                    Toplam
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums font-medium text-zinc-900">
                    {formatTL(totalAdvance)}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums font-medium text-zinc-900">
                    {totalMatches}
                    {exemptCount > 0 && (
                      <span className="text-xs font-normal text-zinc-500 ml-1">
                        ({nonExemptMatches} muafsız)
                      </span>
                    )}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
