"use client";

import React, { useState, ReactNode } from "react";
import {
  CameraIcon,
  UploadIcon,
  FileTextIcon,
  ReaderIcon,
  Share1Icon,
  SpeakerLoudIcon,
  Pencil2Icon,
  BookmarkIcon,
} from "@radix-ui/react-icons";
import { Button, Header, ViewBox, TextViewBox, LoadingSpinner } from "@/components";

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
  const [formattingBlockIndex, setFormattingBlockIndex] = useState<number | null>(null);
  const [formattedCache, setFormattedCache] = useState<Record<string, string>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

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

  const formatBlockText = async (blockIndex: number) => {
    if (!result) return;
    
    const cacheKey = `block-${blockIndex}`;
    
    // Check if already formatted
    if (formattedCache[cacheKey]) {
      setSelectedBlockIndex(blockIndex);
      setViewMode("text");
      return;
    }
    
    // Start formatting
    setFormattingBlockIndex(blockIndex);
    
    try {
      const rawText = result.blocks[blockIndex].text;
      
      const response = await fetch("/api/format-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to format text");
      }
      
      const data = await response.json();
      
      // Cache the formatted text
      setFormattedCache((prev) => ({
        ...prev,
        [cacheKey]: data.formatted_text,
      }));
      
      setSelectedBlockIndex(blockIndex);
      setViewMode("text");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setFormattingBlockIndex(null);
    }
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
                onClick={() => formatBlockText(index)}
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
            <LoadingSpinner label="Extracting and formatting text…" size="md" color="blue" />
          )}
          {error && (
            <ViewBox variant="error" className="w-full max-w-xl">
              <p className="text-lg text-red-700 dark:text-red-300" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
                Error: {error}
              </p>
            </ViewBox>
          )}
        </main>
      </div>
    );
  }

  // Image View
  if (viewMode === "image" && result) {
    return (
      <div className="flex flex-col h-screen w-screen bg-black">
        <Header onBackClick={() => setViewMode("upload")} />

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative" style={{ width: 'fit-content', height: 'fit-content' }}>
              <img
                src={`data:image/jpeg;base64,${result.image_base64}`}
                alt="Uploaded document"
                onLoad={handleImageLoad}
                className="max-w-full max-h-[calc(100vh-120px)] object-contain"
                suppressHydrationWarning
              />
              {renderBoundingBoxes()}
            </div>
          </div>
          
          {/* Loading Overlay */}
          {formattingBlockIndex !== null && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <LoadingSpinner label="Formatting text…" size="md" color="yellow" />
            </div>
          )}
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
    const cacheKey = selectedBlockIndex !== null ? `block-${selectedBlockIndex}` : null;
    const displayText = selectedBlockIndex !== null 
      ? formattedCache[cacheKey!] || result.blocks[selectedBlockIndex]?.text 
      : result.full_text;
    const isFormatting = formattingBlockIndex === selectedBlockIndex;

    const handleListen = async () => {
      if (!displayText) {
        setError("No text to listen to");
        return;
      }

      setIsPlayingAudio(true);
      setError(null);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: displayText }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate audio");
        }

        const data = await response.json();
        
        // Decode base64 audio and create blob
        const binaryString = atob(data.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Play audio
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsPlayingAudio(false);
      }
    };

    return (
      <div className="flex flex-col h-screen w-screen bg-white dark:bg-slate-950">
        <Header onBackClick={() => setViewMode("image")} />

        {/* Text Content */}
        <div className="flex-1 overflow-auto p-8 lg:p-16 flex items-center justify-center">
          {isFormatting ? (
            <LoadingSpinner label="Formatting text…" size="md" color="blue" />
          ) : (
            <TextViewBox>
              {parseMarkdownText(displayText)}
            </TextViewBox>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 border-t-4 border-yellow-500 flex-wrap justify-center">
          <Button icon={<FileTextIcon className="w-6 h-6" />}>
            Text-only mode
          </Button>
          <Button icon={<Share1Icon className="w-6 h-6" />}>
            Share with others
          </Button>
          <Button 
            onClick={handleListen}
            disabled={isPlayingAudio}
            icon={<SpeakerLoudIcon className="w-6 h-6" />}
          >
            {isPlayingAudio ? "Playing..." : "Listen"}
          </Button>
          <Button icon={<img src="/mic.svg" alt="Read" className="w-6 h-6" suppressHydrationWarning />}>
            Read
          </Button>
          <Button icon={<Pencil2Icon className="w-6 h-6" />}>
            Edit
          </Button>
          <Button icon={<BookmarkIcon className="w-6 h-6" />}>
            Notes
          </Button>
        </div>
        <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />
      </div>
    );
  }

  return null;
}
