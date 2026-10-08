"use client";

import { useState } from "react";
import { btn } from "./ui";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  };
  return (
    <>
      <button type="button" onClick={copy} className={btn.secondary}>
        {state === "done" ? "Copied" : label}
      </button>
      <span role="status" className="sr-only">
        {state === "done" ? "Copied to clipboard" : state === "failed" ? "Copy failed. Select the text and copy it manually." : ""}
      </span>
    </>
  );
}
