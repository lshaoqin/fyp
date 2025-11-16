"use client";

import React, { useState } from "react";

interface TextBlock {
  text: string;
  vertices: { x: number; y: number }[];
}

interface ExtractionResult {
  full_text: string;
  blocks: TextBlock[];
  image_base64: string;
}

interface ImageScale {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

export default function Page() {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(
    null
  );
  const [imageScale, setImageScale] = useState<ImageScale>({ width: 0, height: 0 });

  const dyslexiaStyles: React.CSSProperties = {
    fontFamily: 'Verdana, Arial, Helvetica, sans-serif',
    fontSize: '16px',
    lineHeight: 1.6,
    letterSpacing: '0.03em',
    wordSpacing: '0.12em',
    backgroundColor: '#f7fbf6',
    color: '#0f172a',
    padding: '1rem',
    borderRadius: 8,
    maxWidth: '60ch',
    textAlign: 'left' as const,
    whiteSpace: 'pre-wrap' as const,
    overflowWrap: 'break-word' as const,
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedBlockIndex(null);

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
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    
    // Get the actual displayed dimensions
    setImageScale({
      width: img.offsetWidth,
      height: img.offsetHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
  };

  const renderBoundingBoxes = () => {
    if (!result || !imageScale.width || !imageScale.naturalWidth) return null;

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'pointer',
        }}
      >
        {result.blocks.map((block, index) => {
          const vertices = block.vertices;
          if (vertices.length < 2) return null;

          // Calculate the scale factor from original image coordinates to displayed image
          const scaleX = imageScale.width / (imageScale.naturalWidth || 1);
          const scaleY = imageScale.height / (imageScale.naturalHeight || 1);

          // Create path from vertices
          const points = vertices
            .map((v) => `${v.x * scaleX},${v.y * scaleY}`)
            .join(' ');

          const isSelected = selectedBlockIndex === index;

          return (
            <g key={index}>
              <polygon
                points={points}
                fill={isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.1)'}
                stroke={isSelected ? '#3b82f6' : '#93c5fd'}
                strokeWidth="2"
                onClick={() => setSelectedBlockIndex(index)}
                style={{ transition: 'all 0.2s' }}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-start py-20 px-6 bg-white dark:bg-black sm:items-start">
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

        {result && (
          <section className="mt-6 w-full" aria-live="polite">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {/* Image with Bounding Boxes */}
              <div>
                <h2
                  className="mb-3 text-black dark:text-zinc-50"
                  style={{
                    ...dyslexiaStyles,
                    fontSize: `calc(${dyslexiaStyles.fontSize} * 1.2)`,
                    fontWeight: 700,
                    margin: 0,
                    padding: 0,
                  }}
                >
                  Image with Text Boxes
                </h2>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${result.image_base64}`}
                    alt="Uploaded document"
                    onLoad={handleImageLoad}
                    className="w-full h-auto block"
                  />
                  {renderBoundingBoxes()}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click on a text box to see its content
                </p>
              </div>

              {/* Selected Text Display */}
              <div>
                <h2
                  className="mb-3 text-black dark:text-zinc-50"
                  style={{
                    ...dyslexiaStyles,
                    fontSize: `calc(${dyslexiaStyles.fontSize} * 1.2)`,
                    fontWeight: 700,
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {selectedBlockIndex !== null ? 'Selected Text' : 'Full Text'}
                </h2>

                <div style={dyslexiaStyles}>
                  {selectedBlockIndex !== null
                    ? result.blocks[selectedBlockIndex]?.text
                    : result.full_text}
                </div>

                {selectedBlockIndex !== null && (
                  <button
                    onClick={() => setSelectedBlockIndex(null)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                  >
                    Show Full Text
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
