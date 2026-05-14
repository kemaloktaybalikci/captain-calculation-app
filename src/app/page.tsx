"use client";
import { useState } from "react";
import { useCalcState } from "../hooks/useCalcState";
import { StepNavigator } from "../components/wizard/StepNavigator";
import { Step1Roster } from "../components/wizard/Step1Roster";
import { Step2Settings } from "../components/wizard/Step2Settings";
import { Step3Compute } from "../components/wizard/Step3Compute";
import { Toolbar } from "../components/Toolbar";
import { Button } from "../components/ui/Field";
import { clearSeasonPlannerState, SeasonPlanner } from "../components/SeasonPlanner";

const LAST_STEP = 2;
type MainTab = "settlement" | "planning";

export default function Home() {
	const api = useCalcState();
	const { state, setStep, loaded } = api;
	const [activeTab, setActiveTab] = useState<MainTab>("planning");
	const [plannerResetSignal, setPlannerResetSignal] = useState(0);
	const step = state.currentStep;

	const totalAdvance = state.players.reduce((s, p) => s + p.advance, 0);
	const net = totalAdvance + state.config.sponsorContribution - state.config.leagueFee;
	const hasPlayers = state.players.length > 0;
	const hasLeagueFee = state.config.leagueFee > 0;
	const settingsValid = hasLeagueFee && Math.abs(net) < 0.5;
	const canCompute = hasPlayers && settingsValid;

	const canGoToStep = (target: number) => target !== 2 || canCompute;

	const safeSetStep = (target: number) => {
		if (!canGoToStep(target)) return;
		setStep(target);
	};

	const blockReason = !canCompute
		? !hasPlayers
			? "Önce kadroyu oluştur."
			: !hasLeagueFee
				? "Lig ücreti girilmedi."
				: "Toplanan + sponsor, lig ücretine eşit olmalı."
		: "";

	return (
		<div className="h-screen flex flex-col bg-zinc-100 text-zinc-900">
			<header className="shrink-0 bg-white border-b border-zinc-200">
				<div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold text-zinc-900">Kaptan Hesap</h1>
						<p className="text-xs text-zinc-500">Sezon öncesi olası maç başı maliyeti hesaplayın, sezon sonunda lig ücretini takıma adil şekilde paylaştırın.</p>
					</div>
					<Toolbar
						api={api}
						helpMode={activeTab}
						onReset={
							activeTab === "planning"
								? () => {
									clearSeasonPlannerState();
									setPlannerResetSignal((value) => value + 1);
								}
								: api.reset
						}
						resetTitle={
							activeTab === "planning"
								? "Sezon öncesi planlamayı sıfırla"
								: "Sezon sonu mahsuplaşmayı sıfırla"
						}
						resetDescription={
							activeTab === "planning"
								? "Sezon öncesi maç başı ücret hesaplama alanındaki değerler varsayılan hale dönecek. Sezon sonu mahsuplaşma verileri etkilenmez."
								: "Kadro, ayarlar ve sezon sonu mahsuplaşma verileri silinecek. Sezon öncesi planlama değerleri etkilenmez."
						}
					/>
				</div>
			</header>

			<main className="flex-1 min-h-0 overflow-y-auto">
				<div className="max-w-6xl mx-auto px-4 py-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
					<ModuleSidebar active={activeTab} onChange={setActiveTab} />
					<div className="min-w-0">
						<div className={activeTab === "settlement" ? "grid gap-4" : "hidden"}>
							<StepNavigator current={step} onChange={safeSetStep} canGoTo={canGoToStep} />
							{!loaded ? (
								<Skeleton />
							) : (
								<div key={step} className="step-fade-in">
									{step === 0 && <Step1Roster api={api} />}
									{step === 1 && <Step2Settings api={api} />}
									{step === 2 &&
										(canCompute ? (
											<Step3Compute api={api} onGoToStep={setStep} />
										) : (
											<BlockedStep
												reason={blockReason}
												onBack={() => setStep(1)}
											/>
										))}
								</div>
							)}
						</div>
						<div className={activeTab === "planning" ? "" : "hidden"}>
							<SeasonPlanner key={plannerResetSignal} />
						</div>
					</div>
				</div>
			</main>

			<div className={`shrink-0 border-t border-zinc-200 bg-white ${activeTab === "settlement" ? "" : "hidden"}`}>
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
					<div className="text-xs text-amber-700">
						{step === 1 && !canCompute && hasPlayers && hasLeagueFee && blockReason}
					</div>
					<div className="flex items-center gap-2">
						{step > 0 && (
							<Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))}>
								← Geri
							</Button>
						)}
						{step < LAST_STEP && (
							<Button
								onClick={() => safeSetStep(Math.min(LAST_STEP, step + 1))}
								disabled={!canGoToStep(step + 1)}
								title={
									step + 1 === 2 && !canCompute ? blockReason : undefined
								}
							>
								İleri →
							</Button>
						)}
					</div>
				</div>
			</div>

			<footer className="shrink-0 border-t border-zinc-200 bg-white">
				<div className="max-w-6xl mx-auto px-4 py-2 text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
					<a href="https://tenisin.com" target="_blank" rel="noreferrer" className="hover:text-zinc-700 transition-colors">
						tenisin.com
					</a>
					<span className="text-zinc-400">·</span>
					<span>Kemal Oktay Balıkçı &amp; Kağan Erdoğan hayratıdır.</span>
				</div>
			</footer>
		</div>
	);
}

function ModuleSidebar({
	active,
	onChange,
}: {
	active: MainTab;
	onChange: (tab: MainTab) => void;
}) {
	return (
		<aside className="lg:sticky lg:top-4 self-start relative z-20">
			<div className="bg-white border border-zinc-200 rounded-xl p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
			<div className="px-2 py-2 h-9 flex items-center">
				<div className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
					Hesaplama Modülleri
				</div>
			</div>
			<nav className="grid gap-1">
				<ModuleButton
					active={active === "planning"}
					onClick={() => onChange("planning")}
					icon="Σ"
					title="Sezon Öncesi Maç Başı Ücret Hesaplama"
					desc="Takım yoluna göre oyuncu-maç maliyeti"
				/>
				<ModuleButton
					active={active === "settlement"}
					onClick={() => onChange("settlement")}
					icon="₺"
					title="Sezon Sonu Lig Ücreti Mahsuplaşma"
					desc="Oyuncu payları, borçlar ve alacaklar"
				/>
			</nav>
			</div>
		</aside>
	);
}

function ModuleButton({
	active,
	onClick,
	icon,
	title,
	desc,
}: {
	active: boolean;
	onClick: () => void;
	icon: string;
	title: string;
	desc: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full text-left rounded-lg p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
				active
					? "bg-zinc-900 text-white shadow-sm"
					: "text-zinc-700 hover:bg-zinc-100"
			}`}
		>
			<span className="flex items-center gap-3">
				<span className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold ${
					active ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-700"
				}`}>
					{icon}
				</span>
				<span className="min-w-0">
					<span className="block text-sm font-semibold leading-snug">{title}</span>
					<span className={`block text-xs mt-0.5 leading-snug ${active ? "text-zinc-300" : "text-zinc-500"}`}>
						{desc}
					</span>
				</span>
			</span>
		</button>
	);
}

function BlockedStep({
	reason,
	onBack,
}: {
	reason: string;
	onBack: () => void;
}) {
	return (
		<div className="bg-white border border-zinc-200/80 rounded-xl p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col items-center text-center max-w-md mx-auto">
			<div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4 text-amber-600">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
					<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
			</div>
			<h3 className="text-base font-semibold text-zinc-900">
				Hesaplama için koşullar henüz sağlanmadı
			</h3>
			<p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
				{reason}
			</p>
			<div className="mt-5">
				<Button onClick={onBack}>Ayarlara dön</Button>
			</div>
		</div>
	);
}

function Skeleton() {
	return (
		<div className="grid gap-5 md:grid-cols-2">
			{[0, 1, 2, 3].map((i) => (
				<div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 animate-pulse">
					<div className="h-4 w-32 bg-zinc-200 rounded mb-4" />
					<div className="space-y-3">
						<div className="h-3 w-full bg-zinc-100 rounded" />
						<div className="h-9 w-full bg-zinc-100 rounded" />
						<div className="h-3 w-2/3 bg-zinc-100 rounded" />
						<div className="h-9 w-full bg-zinc-100 rounded" />
					</div>
				</div>
			))}
		</div>
	);
}
