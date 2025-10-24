"use client";

import React, { useState } from "react";

export default function Page() {
  const [extracted, setExtracted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dyslexiaStyles: React.CSSProperties = {
    fontFamily: 'Verdana, Arial, Helvetica, sans-serif',
    fontSize: '16px', // at least 14pt (approx 18.6px), using 16px as comfortable default
    lineHeight: 1.6,
    letterSpacing: '0.03em',
    wordSpacing: '0.12em',
    backgroundColor: '#f7fbf6', // gentle pastel background, not pure white
    color: '#0f172a',
    padding: '1rem',
    borderRadius: 8,
    maxWidth: '60ch', // keep ~60 characters per line
    textAlign: 'left' as const,
    whiteSpace: 'pre-wrap' as const,
    overflowWrap: 'break-word' as const,
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setExtracted(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExtracted(data.text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-20 px-6 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50" style={{ fontFamily: dyslexiaStyles.fontFamily }}>
          Upload an image or PDF to extract text
        </h1>

        <input
          aria-label="Select image or PDF"
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="mb-4"
        />

        {loading && <p className="text-sm">Extracting text…</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}

        {extracted && (
          <section className="mt-6 w-full" aria-live="polite">
            <h2
              className="mb-2 text-black dark:text-zinc-50"
              style={{
                ...dyslexiaStyles,
                fontSize: `calc(${dyslexiaStyles.fontSize} * 1.2)`, // heading 20% larger
                fontWeight: 700,
                margin: 0,
                padding: 0,
              }}
            >
              Extracted text
            </h2>

            <div style={{ marginTop: 8 }}>
              <div style={dyslexiaStyles}>
                {extracted}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
