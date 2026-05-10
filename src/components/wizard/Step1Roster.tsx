"use client";
import { memo, useCallback, useRef, useState } from "react";
import type { CalcStateApi } from "../../hooks/useCalcState";
import { makePlayer } from "../../lib/defaults";
import { parseRosterExcel, generateRosterTemplate } from "../../lib/excel-import";
import { Button, Card, NumberInput, TextInput } from "../ui/Field";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import type { Player } from "../../lib/types";
import { formatTL } from "../../lib/format";

type SortColumn = "name" | "advance" | "matches" | "exempt";
type SortState = { column: SortColumn; direction: "asc" | "desc" } | null;

interface RowProps {
	player: Player;
	index: number;
	selected: boolean;
	onToggleSelect: (id: string) => void;
	onUpdate: (id: string, patch: Partial<Player>) => void;
	onRemove: (id: string) => void;
}

const PlayerRow = memo(function PlayerRow({ player, index, selected, onToggleSelect, onUpdate, onRemove }: RowProps) {
	return (
		<tr className={`border-b border-zinc-100 last:border-0 transition-colors group ${selected ? "bg-zinc-900/[0.04]" : "hover:bg-zinc-50/60"}`}>
			<td className="py-2.5 px-2 w-1">
				<input type="checkbox" checked={selected} onChange={() => onToggleSelect(player.id)} className="h-4 w-4 rounded border-zinc-300 cursor-pointer" aria-label={`${player.name} seç`} />
			</td>
			<td className="py-2.5 px-2 text-right tabular-nums text-zinc-400 w-1">{index + 1}</td>
			<td className="py-2.5 px-2 min-w-[180px]">
				<TextInput value={player.name} onChange={(v) => onUpdate(player.id, { name: v })} className="border-transparent hover:border-zinc-300 bg-transparent group-hover:bg-white" />
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
				<input type="checkbox" checked={player.exempt} onChange={(e) => onUpdate(player.id, { exempt: e.target.checked })} className="h-4 w-4 rounded border-zinc-300 cursor-pointer" />
			</td>
			<td className="py-2.5 pl-2 pr-1 text-right w-1">
				<button
					type="button"
					onClick={() => onRemove(player.id)}
					className="inline-flex items-center justify-center w-7 h-7 rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-300"
					title={`${player.name} oyuncusunu sil`}
					aria-label={`${player.name} oyuncusunu sil`}>
					<TrashIcon />
				</button>
			</td>
		</tr>
	);
});

function SortHeader({
	column,
	current,
	onSort,
	align = "left",
	children,
}: {
	column: SortColumn;
	current: SortState;
	onSort: (col: SortColumn) => void;
	align?: "left" | "right" | "center";
	children: React.ReactNode;
}) {
	const isActive = current?.column === column;
	const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
	return (
		<button
			type="button"
			onClick={() => onSort(column)}
			className={`w-full inline-flex items-center gap-1 font-medium text-xs uppercase text-zinc-500 hover:text-zinc-700 transition focus:outline-none focus-visible:text-zinc-900 ${justify}`}>
			{children}
			<span className={`inline-block leading-none ${isActive ? "text-zinc-700" : "text-zinc-300"}`} aria-hidden="true">
				{isActive ? (current.direction === "asc" ? "↑" : "↓") : "↕"}
			</span>
		</button>
	);
}

function TrashIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M3 6h18" />
			<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
			<path d="M10 11v6" />
			<path d="M14 11v6" />
		</svg>
	);
}

export function Step1Roster({ api }: { api: CalcStateApi }) {
	const { state, addPlayer, removePlayer, updatePlayer, setPlayers } = api;
	const [newName, setNewName] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [bulkAmount, setBulkAmount] = useState(0);
	const [confirmDelete, setConfirmDelete] = useState<Player | null>(null);
	const [sortState, setSortState] = useState<SortState>(null);
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

	const toggleSelected = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const requestRemove = useCallback(
		(id: string) => {
			const player = state.players.find((p) => p.id === id);
			if (player) setConfirmDelete(player);
		},
		[state.players],
	);

	const performRemove = (id: string) => {
		removePlayer(id);
		setSelectedIds((prev) => {
			if (!prev.has(id)) return prev;
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
		setConfirmDelete(null);
	};

	const clearSelection = () => setSelectedIds(new Set());

	const bulkSetExempt = (exempt: boolean) => {
		setPlayers(state.players.map((p) => (selectedIds.has(p.id) ? { ...p, exempt } : p)));
	};

	const bulkSetAdvance = () => {
		setPlayers(state.players.map((p) => (selectedIds.has(p.id) ? { ...p, advance: bulkAmount } : p)));
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
				if (!confirm(`Mevcut ${state.players.length} oyuncu silinip ${result.players.length} oyuncu yüklenecek. Devam edilsin mi?`)) {
					return;
				}
			}
			setPlayers(result.players);
			const text = `${result.players.length} oyuncu yüklendi.${result.warnings.length > 0 ? ` Uyarı: ${result.warnings.join("; ")}` : ""}`;
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
	const nonExemptMatches = state.players.filter((p) => !p.exempt).reduce((s, p) => s + p.matches, 0);
	const trimmedQuery = searchQuery.trim().toLocaleLowerCase("tr");
	const visiblePlayers = trimmedQuery ? state.players.filter((p) => p.name.toLocaleLowerCase("tr").includes(trimmedQuery)) : state.players;

	const selectedPlayers = state.players.filter((p) => selectedIds.has(p.id));
	const allSelectedExempt = selectedPlayers.length > 0 && selectedPlayers.every((p) => p.exempt);

	const sortedPlayers = (() => {
		if (!sortState) return visiblePlayers;
		const arr = [...visiblePlayers];
		arr.sort((a, b) => {
			let cmp = 0;
			switch (sortState.column) {
				case "name":
					cmp = a.name.localeCompare(b.name, "tr");
					break;
				case "advance":
					cmp = a.advance - b.advance;
					break;
				case "matches":
					cmp = a.matches - b.matches;
					break;
				case "exempt":
					cmp = (a.exempt ? 1 : 0) - (b.exempt ? 1 : 0);
					break;
			}
			return sortState.direction === "asc" ? cmp : -cmp;
		});
		return arr;
	})();

	const cycleSort = (column: SortColumn) => {
		setSortState((prev) => {
			if (prev?.column !== column) return { column, direction: "asc" };
			if (prev.direction === "asc") return { column, direction: "desc" };
			return null;
		});
	};

	const selectAllVisible = () => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			for (const p of visiblePlayers) next.add(p.id);
			return next;
		});
	};

	return (
		<div className="grid gap-5">
			<Card title="Oyuncu Ekle">
				<div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-0">
					<div className="flex-1 flex flex-wrap gap-3 items-center md:pr-6">
						<div className="flex-1 min-w-[180px]">
							<TextInput value={newName} onChange={setNewName} placeholder="Oyuncu adı" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
						</div>
						<Button onClick={handleAdd}>+ Ekle</Button>
					</div>
					<div className="md:border-l md:border-zinc-200 md:pl-6 flex flex-wrap gap-2 items-center">
						<Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
							{importing ? "Yükleniyor…" : "Excel Yükle"}
						</Button>
						<Button
							variant="ghost"
							onClick={async () => {
								try {
									await generateRosterTemplate();
								} catch (e) {
									setImportMessage({ kind: "err", text: String(e) });
								}
							}}>
							Örnek İndir
						</Button>
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
				</div>
				{importMessage && (
					<div className={`mt-3 text-xs ${importMessage.kind === "err" ? "text-red-600" : importMessage.kind === "warn" ? "text-amber-600" : "text-emerald-700"}`}>{importMessage.text}</div>
				)}
			</Card>

			<Card title={`Kadro · ${state.players.length} oyuncu${exemptCount > 0 ? `, ${exemptCount} muaf` : ""}`}>
				{state.players.length === 0 ? (
					<div className="text-sm text-zinc-500 py-8 text-center">Henüz oyuncu yok. 'Oyuncu Ekle' butonu ile veya 'Excel' ile oyuncu ekleyebilirsiniz.</div>
				) : (
					<>
						<div className="mb-3 flex flex-wrap items-start gap-3">
							<div className="w-full md:w-1/3 md:max-w-xs relative">
								<TextInput
									value={searchQuery}
									onChange={setSearchQuery}
									placeholder="Oyuncu ara…"
									className={searchQuery ? "pr-8" : ""}
								/>
								{searchQuery && (
									<button
										type="button"
										onClick={() => setSearchQuery("")}
										className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-5 h-5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
										title="Aramayı temizle"
										aria-label="Aramayı temizle"
									>
										<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
											<path d="m3 3 10 10M13 3 3 13" />
										</svg>
									</button>
								)}
							</div>
							{selectedIds.size === 0 && visiblePlayers.length > 0 && (
								<button type="button" onClick={selectAllVisible} className="md:ml-auto text-xs text-zinc-500 hover:text-zinc-700 underline-offset-2 hover:underline transition self-center">
									{trimmedQuery ? "Görüneni Seç" : "Tümünü Seç"}
								</button>
							)}
							{selectedIds.size > 0 && (
								<div className="md:ml-auto w-full md:w-1/3 md:max-w-sm px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-md flex flex-wrap items-center gap-2 text-xs">
									<span className="font-medium text-zinc-900 whitespace-nowrap">{selectedIds.size} seçildi</span>
									<button
										type="button"
										onClick={() => bulkSetExempt(!allSelectedExempt)}
										className="px-2 py-1 rounded font-medium bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition whitespace-nowrap">
										{allSelectedExempt ? "Muafı Kaldır" : "Muaf"}
									</button>
									<div className="flex items-center gap-1 flex-1 min-w-[120px]">
										<input
											type="text"
											inputMode="decimal"
											value={bulkAmount === 0 ? "" : String(bulkAmount)}
											onChange={(e) => {
												const raw = e.target.value;
												if (!/^[0-9.,]*$/.test(raw)) return;
												if (raw === "") {
													setBulkAmount(0);
													return;
												}
												const v = parseFloat(raw.replace(",", "."));
												setBulkAmount(Number.isFinite(v) ? v : 0);
											}}
											onFocus={(e) => e.currentTarget.select()}
											placeholder="Tutar"
											className="flex-1 min-w-0 rounded px-2 py-1 text-xs bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-400 text-right tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
										/>
										<button type="button" onClick={bulkSetAdvance} className="px-2 py-1 rounded font-medium bg-zinc-900 text-white hover:bg-zinc-700 transition whitespace-nowrap">
											Ata
										</button>
									</div>
									<button type="button" onClick={clearSelection} className="text-zinc-400 hover:text-zinc-700 transition p-0.5 rounded" title="Seçimi temizle" aria-label="Seçimi temizle">
										<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
											<path d="m3 3 10 10M13 3 3 13" />
										</svg>
									</button>
								</div>
							)}
						</div>
						<div className="overflow-x-auto -mx-1">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-xs uppercase text-zinc-500 border-b border-zinc-200">
										<th className="py-2.5 px-2 w-1" />
										<th className="py-2.5 px-2 font-medium text-right w-1">#</th>
										<th className="py-2.5 px-2">
											<SortHeader column="name" current={sortState} onSort={cycleSort}>
												Oyuncu Adı
											</SortHeader>
										</th>
										<th className="py-2.5 px-2 text-right">
											<SortHeader column="advance" current={sortState} onSort={cycleSort} align="right">
												İlk Ücret (TL)
											</SortHeader>
										</th>
										<th className="py-2.5 px-2 text-right">
											<SortHeader column="matches" current={sortState} onSort={cycleSort} align="right">
												Maç Sayısı
											</SortHeader>
										</th>
										<th className="py-2.5 px-2 text-center">
											<SortHeader column="exempt" current={sortState} onSort={cycleSort} align="center">
												Muaf
											</SortHeader>
										</th>
										<th className="py-2.5 px-2"></th>
									</tr>
								</thead>
								<tbody>
									{sortedPlayers.length === 0 ? (
										<tr>
											<td colSpan={7} className="py-8 text-center text-sm text-zinc-500">
												&ldquo;{searchQuery}&rdquo; ile eşleşen oyuncu yok.
											</td>
										</tr>
									) : (
										sortedPlayers.map((p, idx) => (
											<PlayerRow key={p.id} player={p} index={idx} selected={selectedIds.has(p.id)} onToggleSelect={toggleSelected} onUpdate={updatePlayer} onRemove={requestRemove} />
										))
									)}
								</tbody>
								<tfoot>
									<tr className="border-t border-zinc-200 text-sm">
										<td />
										<td />
										<td className="py-3 px-2 text-xs uppercase tracking-wide text-zinc-500 font-medium">Toplam</td>
										<td className="py-3 px-2 text-right tabular-nums font-medium text-zinc-900">{formatTL(totalAdvance)}</td>
										<td className="py-3 px-2 text-right tabular-nums font-medium text-zinc-900">
											{totalMatches}
											{exemptCount > 0 && <span className="text-xs font-normal text-zinc-500 ml-1">({nonExemptMatches} Net)</span>}
										</td>
										<td colSpan={2} />
									</tr>
								</tfoot>
							</table>
						</div>
					</>
				)}
			</Card>

			<ConfirmDialog
				open={confirmDelete !== null}
				onClose={() => setConfirmDelete(null)}
				onConfirm={() => confirmDelete && performRemove(confirmDelete.id)}
				title="Oyuncuyu sil"
				description={
					<>
						<span className="font-medium text-zinc-900">{confirmDelete?.name}</span> kadrodan silinecek. Bu işlem geri alınamaz.
					</>
				}
			/>
		</div>
	);
}
