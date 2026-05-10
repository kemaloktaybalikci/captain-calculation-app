"use client";
import { useEffect, type ReactNode } from "react";
import { Button } from "./Field";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Sil",
  cancelLabel = "Vazgeç",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
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
      <div className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-xl shadow-xl dialog-in">
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-base font-semibold text-zinc-900 mb-2">
            {title}
          </h3>
          <div className="text-sm text-zinc-600 leading-relaxed">
            {description}
          </div>
        </div>
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 rounded-b-xl flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
