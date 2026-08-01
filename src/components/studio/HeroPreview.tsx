"use client";

import { useEffect, useState } from "react";
import type { Hero } from "@/schemas";

type HeroPreviewProps = Readonly<{
  data: Hero;
}>;

export function HeroPreview({ data }: HeroPreviewProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const words = data.cutWords.length > 0 ? data.cutWords : ["a feeling"];
  const word = words[wordIndex % words.length]!;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || words.length < 2) {
      return undefined;
    }

    const interval = window.setInterval(() => setWordIndex((index) => index + 1), 2600);
    return () => window.clearInterval(interval);
  }, [words.length]);

  return (
    <aside className="studio-hero-preview" aria-label="Live hero preview">
      <header>
        <span>Live preview</span>
        <i aria-hidden="true" />
      </header>
      <div className="studio-hero-preview__screen">
        <small>{data.eyebrow}</small>
        <h2>
          {data.line1}
          <span>{data.line2}</span>
          <em>{word}</em>
        </h2>
        <p>{data.sub}</p>
        <button type="button">{data.primaryCta.label}</button>
      </div>
    </aside>
  );
}
