"use client";
import { useState } from "react";
import type { CalcStateApi } from "../hooks/useCalcState";
import { Button, IconButton } from "./ui/Field";
import { HelpDialog } from "./HelpDialog";

export function Toolbar({ api }: { api: CalcStateApi }) {
  const [helpOpen, setHelpOpen] = useState(false);

  const handleReset = () => {
    if (
      confirm(
        "Tüm veri silinecek. localStorage temizlenecek. Devam edilsin mi?",
      )
    ) {
      api.reset();
    }
  };

  return (
    <div className="flex gap-1 items-center">
      <IconButton
        onClick={() => setHelpOpen(true)}
        title="Nasıl hesaplanıyor?"
      >
        <QuestionIcon />
      </IconButton>
      <Button variant="ghost" onClick={handleReset}>
        Sıfırla
      </Button>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
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
