"use client";
import { useEffect } from "react";
import { IconButton } from "./ui/Field";

export function HelpDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
          <p>
            Bu uygulama takım kaptanlarına, lig giderini oyunculara
            <em> oynadıkları maç sayısına göre </em> dağıtmak için kullanılır.
          </p>

          <Section title="Maç Başı Pay">
            <p>
              <strong>Toplanan avans + sponsor = lig ücreti</strong> olduğu
              senaryolarda kullanılır. Lig ücreti, muaf olmayan oyuncuların
              oynadığı toplam maça bölünerek <em>maç başı bedel</em> bulunur.
              Her oyuncuya bu bedel kadar pay düşer.
            </p>
            <Example>
              <p>
                30.000 TL lig ücreti, 5.000 TL sponsor → 25.000 TL dağıtılır.
              </p>
              <p>20 maç oynandı → maç başı 1.250 TL.</p>
              <p>5 maç oynayan oyuncunun payı 6.250 TL olur.</p>
            </Example>
          </Section>

          <Section title="Pay, net ve mahsup">
            <p>
              <strong>Net = İlk ücret − Pay.</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="text-emerald-700 font-medium">
                  Net pozitif:
                </span>{" "}
                kasa o oyuncuya borçlu (alacaklı oyuncu).
              </li>
              <li>
                <span className="text-red-700 font-medium">
                  Net negatif:
                </span>{" "}
                oyuncu kasaya borçlu.
              </li>
            </ul>
            <p>
              <strong>Kasa Merkezli</strong> mahsupta herkes kasayla
              hesaplaşır. <strong>Peer-to-Peer</strong> mahsupta borçlu kişi
              doğrudan alacaklıya öder (minimum transferle).
            </p>
          </Section>

          <Section title="Muaf oyuncu">
            <p>
              Avans vermeyen, payı hesaba katılmayan oyuncudur (özel davetli
              vb.). Maçları, muaf-olmayanların maliyet bölümüne dahil
              edilmez; böylece davetlinin masrafı doğal olarak diğer
              oyunculara dağılır.
            </p>
          </Section>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">
        {title}
      </h3>
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
