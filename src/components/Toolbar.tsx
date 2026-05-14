"use client";
import { useEffect, useState } from "react";
import type { CalcStateApi } from "../hooks/useCalcState";
import { Button, IconButton } from "./ui/Field";
import { ConfirmDialog } from "./ui/ConfirmDialog";

export type HelpMode = "settlement" | "planning";

export function Toolbar({
  api,
  onReset,
  helpMode = "settlement",
  resetTitle = "Tüm veriyi sıfırla",
  resetDescription = "Kadro, ayarlar ve hesaplar dahil tüm veriler kalıcı olarak silinecek. Bu işlem geri alınamaz.",
}: {
  api: CalcStateApi;
  onReset?: () => void;
  helpMode?: HelpMode;
  resetTitle?: string;
  resetDescription?: string;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex gap-1 items-center">
      <IconButton
        onClick={() => setHelpOpen(true)}
        title="Nasıl hesaplanıyor?"
      >
        <QuestionIcon />
      </IconButton>
      <Button variant="ghost" onClick={() => setConfirmReset(true)}>
        Sıfırla
      </Button>
      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        mode={helpMode}
      />
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          if (onReset) onReset();
          else api.reset();
          setConfirmReset(false);
        }}
        title={resetTitle}
        description={resetDescription}
        confirmLabel="Sıfırla"
      />
    </div>
  );
}

function HelpDialog({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  mode: HelpMode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white border border-zinc-200 rounded-2xl shadow-xl dialog-in">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">
            Nasıl hesaplanıyor?
          </h2>
          <IconButton onClick={onClose} title="Kapat">
            <CloseIcon />
          </IconButton>
        </div>
        <div className="px-6 py-5 space-y-5 text-sm text-zinc-700 leading-relaxed">
          {mode === "planning" ? <PlanningHelp /> : <SettlementHelp />}
        </div>
        <div className="sticky bottom-0 flex justify-end px-6 py-3 bg-white/95 backdrop-blur border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium px-3 py-1.5 rounded-md text-zinc-700 hover:bg-zinc-100 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

function SettlementHelp() {
  return (
    <>
      <p>
        Sezon sonu lig ücreti mahsuplaşma modülü, oyuncuların ilk ödediği
        ücretleri, maç sayılarını ve varsa sponsor katkısını kullanarak kimin
        borçlu, kimin alacaklı olduğunu hesaplar.
      </p>

      <Section title="Maç Başı Pay">
        <p>
          Ücret, yalnızca muaf olmayan oyuncuların oynadığı maç sayılarına göre
          dağıtılır. Maç yapmayan oyuncuya ücret yansımaz. Dağıtılacak tutar,
          muaf olmayan oyuncuların oynadığı toplam maça bölünerek maç başı bedel
          bulunur.
        </p>
        <Example>
          <p>30.000 TL lig ücreti, 5.000 TL sponsor → 25.000 TL dağıtılır.</p>
          <p>20 maç oynandı → maç başı 1.250 TL.</p>
          <p>5 maç oynayan oyuncunun payı 6.250 TL olur.</p>
        </Example>
      </Section>

      <Section title="Katılım Payı + Maç Başı Pay">
        <p>
          Ücretin bir kısmı tüm muaf olmayan oyunculara sabit katılım payı
          olarak dağıtılır. Toplanan avans + sponsor lig ücretine eşit olmalıdır.
          Sponsor lig ücretinden düşüldükten sonra oyunculara dağıtılacak tutarın
          belirlenen yüzdesi katılım payı havuzu kabul edilir ve muaf olmayan
          oyunculara eşit kişi başı katılım payı olarak yazılır. Kalan tutar,
          muaf olmayan oyuncuların maç sayılarına bölünür.
        </p>
        <Example>
          <p>
            12.000 TL lig ücreti, 2.000 TL sponsor, 5 oyuncu, kişi başı 2.000 TL
            avans, 16 toplam maç, katılım payı oranı %40.
          </p>
          <p>
            Oyunculara dağıtılacak: 12.000 - 2.000 = 10.000 TL. Katılım payı
            havuzu: 10.000 × %40 = 4.000 TL. Kişi başı katılım payı: 4.000 / 5 =
            800 TL.
          </p>
          <p>Maçlara dağıtılan: 6.000 / 16 = 375 TL maç başı.</p>
        </Example>
      </Section>

      <Section title="Pay, net ve mahsup">
        <p>
          <strong>Net = İlk ücret − Pay.</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="text-emerald-700 font-medium">Net pozitif:</span>{" "}
            kasa o oyuncuya borçlu (alacaklı oyuncu).
          </li>
          <li>
            <span className="text-red-700 font-medium">Net negatif:</span>{" "}
            oyuncu kasaya borçlu.
          </li>
        </ul>
        <p>
          <strong>Kasa Merkezli</strong> mahsupta herkes kasayla hesaplaşır.
          <strong> Peer-to-Peer</strong> mahsupta borçlu kişi doğrudan
          alacaklıya öder (minimum transferle).
        </p>
      </Section>
    </>
  );
}

function PlanningHelp() {
  return (
    <>
      <p>
        Sezon öncesi maç başı ücret hesaplama modülü, lig başlamadan önce bir
        takımın olası sezon yoluna göre oyuncu başına maç maliyetini hesaplar.
      </p>

      <Section title="Seri hesabı">
        <p>
          Lig aşamasındaki seri sayısı toplam takım sayısından 1 eksiltilerek
          bulunur. Playoff turları, final four ve final seçimine göre toplam seri
          sayısı hesaplanır. Final four her zaman 3 seri, final ise 1 seri kabul
          edilir.
        </p>
      </Section>

      <Section title="Oyuncu-maç hesabı">
        <p>
          Tüm seriler aynı maç sayısına sahiptir ve her maç double kabul edilir.
          Bu yüzden her maç için oyuncu katsayısı 2 olur.
        </p>
        <Example>
          <p>Oyuncu-maç = toplam seri × seri başına maç × 2.</p>
          <p>Maç başı ücret = lig ücreti / oyuncu-maç.</p>
          <p>
            10 takım, 8 maçlık seri, direkt final four + final: 9 + 3 + 1 = 13
            seri. Oyuncu-maç: 13 × 8 × 2 = 208.
          </p>
        </Example>
      </Section>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 space-y-0.5 leading-relaxed">
      {children}
    </div>
  );
}

function QuestionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.5 9c.3-1.4 1.4-2.2 2.7-2.2 1.6 0 2.7.95 2.7 2.3 0 1.05-.6 1.6-1.7 2.2-1.05.55-1.45 1-1.45 2.05V13.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="11.85" cy="16.5" r="0.95" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m3 3 10 10M13 3 3 13" />
    </svg>
  );
}
