"use client";

import React, { useState, ReactNode } from "react";
import {
  CameraIcon,
  UploadIcon,
  FileTextIcon,
  ReaderIcon,
  GearIcon,
  PersonIcon,
  ArrowLeftIcon,
  Share1Icon,
  SpeakerLoudIcon,
  Pencil2Icon,
  BookmarkIcon,
} from "@radix-ui/react-icons";

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

// Function to parse markdown formatting (**text** -> bold)
function parseMarkdownText(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push(
      <strong key={`bold-${match.index}`}>{match[1]}</strong>
    );
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

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
    fontSize: '20px',
    lineHeight: 1.8,
    letterSpacing: '0.03em',
    wordSpacing: '0.12em',
    backgroundColor: '#f7fbf6',
    color: '#0f172a',
    padding: '2rem',
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
                fill={isSelected ? 'rgba(37, 99, 235, 0.3)' : 'rgba(255, 193, 7, 0.15)'}
                stroke={isSelected ? '#2563eb' : '#ffc107'}
                strokeWidth="3"
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
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <main className="flex flex-col items-center justify-center gap-12 px-6 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 text-blue-600" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
              Make text friendlier
            </h1>
            <p className="text-2xl text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
              Take a photo of some text to make it friendlier
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
            <label className="flex flex-col items-center justify-center p-12 border-4 border-blue-600 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors group">
              <CameraIcon className="w-24 h-24 mb-4 text-blue-600 transition-colors" />
              <span className="font-bold text-lg text-center text-blue-600 dark:text-blue-400" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
                Take a photo
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <label className="flex flex-col items-center justify-center p-12 border-4 border-blue-600 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors group">
              <UploadIcon className="w-24 h-24 mb-4 text-blue-600 transition-colors" />
              <span className="font-bold text-lg text-center text-blue-600 dark:text-blue-400" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
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

          <div className="grid grid-cols-2 gap-6 w-full max-w-2xl mt-4">
            <button className="flex flex-col items-center justify-center p-8 border-4 border-gray-400 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-all group">
              <FileTextIcon className="w-20 h-20 mb-3 text-gray-600 dark:text-gray-400 group-hover:text-yellow-500 transition-colors" />
              <span className="text-base text-center font-bold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
                My previous files
              </span>
            </button>

            <button className="flex flex-col items-center justify-center p-8 border-4 border-gray-400 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-all group">
              <ReaderIcon className="w-20 h-20 mb-3 text-gray-600 dark:text-gray-400 group-hover:text-yellow-500 transition-colors" />
              <span className="text-base text-center font-bold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
                Discover others&apos; files
              </span>
            </button>
          </div>

          {loading && (
            <div className="text-center flex flex-col items-center gap-6">
              <div className="animate-spin">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full"></div>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
                Extracting and formatting text…
              </p>
            </div>
          )}
          {error && (
            <div className="text-center bg-red-100 dark:bg-red-950 p-6 rounded-xl w-full max-w-xl">
              <p className="text-lg text-red-700 dark:text-red-300" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
                Error: {error}
              </p>
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
        <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-b-4 border-yellow-500">
          <button
            onClick={() => setViewMode("upload")}
            className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:text-yellow-500 transition-colors"
          >
            <ArrowLeftIcon className="w-7 h-7" />
            <span className="text-lg font-bold" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>Back</span>
          </button>
          <div className="flex gap-6">
            <button className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors">
              <GearIcon className="w-7 h-7" />
            </button>
            <button className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors">
              <PersonIcon className="w-7 h-7" />
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
        <div className="p-6 bg-white dark:bg-slate-900 border-t-4 border-yellow-500">
          <p className="text-base text-gray-600 dark:text-gray-400 text-center font-semibold" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
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
      <div className="flex flex-col h-screen w-screen bg-white dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-b-4 border-yellow-500">
          <button
            onClick={() => setViewMode("image")}
            className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:text-yellow-500 transition-colors"
          >
            <ArrowLeftIcon className="w-7 h-7" />
            <span className="text-lg font-bold" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>Back</span>
          </button>
          <div className="flex gap-6">
            <button className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors">
              <GearIcon className="w-7 h-7" />
            </button>
            <button className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors">
              <PersonIcon className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 overflow-auto p-8 lg:p-16 flex items-center justify-center">
          <div style={dyslexiaStyles} className="mx-auto max-w-4xl">
            {parseMarkdownText(displayText)}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 border-t-4 border-yellow-500 flex-wrap justify-center">
          <button className="px-8 py-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors font-bold text-base" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
            <FileTextIcon className="w-6 h-6" />
            Text-only mode
          </button>
          <button className="px-8 py-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors font-bold text-base" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
            <Share1Icon className="w-6 h-6" />
            Share with others
          </button>
          <button className="px-8 py-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors font-bold text-base" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
            <SpeakerLoudIcon className="w-6 h-6" />
            Listen
          </button>
          <button className="px-8 py-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors font-bold text-base" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
            <img src="/mic.svg" alt="Read" className="w-6 h-6" />
            Read
          </button>
          <button className="px-8 py-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors font-bold text-base" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
            <Pencil2Icon className="w-6 h-6" />
            Edit
          </button>
          <button className="px-8 py-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors font-bold text-base" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
            <BookmarkIcon className="w-6 h-6" />
            Notes
          </button>
        </div>
      </div>
    );
  }

  return null;
}
