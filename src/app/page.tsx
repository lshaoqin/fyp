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

type ViewMode = "upload" | "image" | "text";

export default function Page() {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(
    null
  );
  const [imageScale, setImageScale] = useState<ImageScale>({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>("upload");

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
    setViewMode("upload");

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
      setViewMode("image");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    
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
          width: imageScale.width,
          height: imageScale.height,
          cursor: 'pointer',
        }}
        width={imageScale.width}
        height={imageScale.height}
      >
        {result.blocks.map((block, index) => {
          const vertices = block.vertices;
          if (vertices.length < 2) return null;

          const scaleX = imageScale.width / (imageScale.naturalWidth || 1);
          const scaleY = imageScale.height / (imageScale.naturalHeight || 1);

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
                onClick={() => {
                  setSelectedBlockIndex(index);
                  setViewMode("text");
                }}
                style={{ transition: 'all 0.2s' }}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  // Upload View
  if (viewMode === "upload") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <main className="flex flex-col items-center justify-center gap-8 px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2 text-black dark:text-zinc-50">
              Make text friendlier
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Take a photo of some text to make it friendlier
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full max-w-md">
            <label className="flex flex-col items-center justify-center p-8 border-2 border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
              <div className="text-4xl mb-2">📷</div>
              <span className="font-medium text-center text-blue-600 dark:text-blue-400">
                Take a photo
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <label className="flex flex-col items-center justify-center p-8 border-2 border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
              <div className="text-4xl mb-2">📁</div>
              <span className="font-medium text-center text-blue-600 dark:text-blue-400">
                Upload from device
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-4">
            <button className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-gray-700 dark:text-gray-300">
              <div className="text-2xl mb-2">📋</div>
              <span className="text-xs text-center font-medium">
                My previous files
              </span>
            </button>

            <button className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-gray-700 dark:text-gray-300">
              <div className="text-2xl mb-2">👥</div>
              <span className="text-xs text-center font-medium">
                Discover others&apos; files
              </span>
            </button>
          </div>

          {loading && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Extracting text…</p>
            </div>
          )}
          {error && (
            <div className="text-center bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <p className="text-red-600 dark:text-red-400">Error: {error}</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Image View
  if (viewMode === "image" && result) {
    return (
      <div className="flex flex-col h-screen w-screen bg-black">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900">
          <button
            onClick={() => setViewMode("upload")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back
          </button>
          <div className="flex gap-4">
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ⚙️
            </button>
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              👤
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative" style={{ width: 'fit-content', height: 'fit-content' }}>
              <img
                src={`data:image/jpeg;base64,${result.image_base64}`}
                alt="Uploaded document"
                onLoad={handleImageLoad}
                className="max-w-full max-h-[calc(100vh-120px)] object-contain"
              />
              {renderBoundingBoxes()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Click on a text box to view its content
          </p>
        </div>
      </div>
    );
  }

  // Text View
  if (viewMode === "text" && result) {
    const displayText = selectedBlockIndex !== null 
      ? result.blocks[selectedBlockIndex]?.text 
      : result.full_text;

    return (
      <div className="flex flex-col h-screen w-screen bg-white dark:bg-black">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setViewMode("image")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back
          </button>
          <div className="flex gap-4">
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ⚙️
            </button>
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              👤
            </button>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-12">
          <div style={dyslexiaStyles} className="mx-auto max-w-3xl">
            {displayText}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-wrap justify-center">
          <button className="px-6 py-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
            📄 Text-only mode
          </button>
          <button className="px-6 py-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
            👥 Share with others
          </button>
          <button className="px-6 py-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
            🔊 Listen
          </button>
          <button className="px-6 py-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
            🎤 Read
          </button>
          <button className="px-6 py-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
            ✏️ Edit
          </button>
          <button className="px-6 py-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
            📝 Notes
          </button>
        </div>
      </div>
    );
  }

  return null;
}
