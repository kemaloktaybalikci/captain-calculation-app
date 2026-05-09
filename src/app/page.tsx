"use client";
import { useCalcState } from "../hooks/useCalcState";
import { StepNavigator } from "../components/wizard/StepNavigator";
import { Step1Roster } from "../components/wizard/Step1Roster";
import { Step2Settings } from "../components/wizard/Step2Settings";
import { Step3Compute } from "../components/wizard/Step3Compute";
import { Toolbar } from "../components/Toolbar";
import { Button } from "../components/ui/Field";

const LAST_STEP = 2;

export default function Home() {
	const api = useCalcState();
	const { state, setStep, loaded } = api;
	const step = state.currentStep;

	return (
		<div className="min-h-screen bg-zinc-100 text-zinc-900 pb-24">
			<header className="bg-white border-b border-zinc-200">
				<div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold text-zinc-900">Kaptan Hesap</h1>
						<p className="text-xs text-zinc-500">Tenis lig ücretini takıma adil dağıtın.</p>
					</div>
					<Toolbar api={api} />
				</div>
			</header>

			<div className="max-w-6xl mx-auto px-4 pt-4">
				<StepNavigator current={step} onChange={setStep} />
			</div>

			<main className="max-w-6xl mx-auto px-4 py-5">
				{!loaded ? (
					<Skeleton />
				) : (
					<div key={step} className="step-fade-in">
						{step === 0 && <Step1Roster api={api} />}
						{step === 1 && <Step2Settings api={api} />}
						{step === 2 && <Step3Compute api={api} onGoToStep={setStep} />}
					</div>
				)}
			</main>

			<footer className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-zinc-200">
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
					<Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || !loaded}>
						← Geri
					</Button>
					<div className="hidden md:flex items-center text-xs text-zinc-500 truncate">
						<a href="https://tenisin.com" target="_blank" rel="noreferrer" className="hover:text-zinc-700 transition-colors">
							tenisin.com
						</a>
						<span className="mx-2 text-zinc-400">·</span>
						<span>Kemal Oktay Balıkçı &amp; Kaan Erdoğan hayratıdır.</span>
					</div>
					<Button onClick={() => setStep(Math.min(LAST_STEP, step + 1))} disabled={step === LAST_STEP || !loaded}>
						İleri →
					</Button>
				</div>
			</footer>
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
