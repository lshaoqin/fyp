"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PlayIcon, PauseIcon } from "@radix-ui/react-icons";
import { Button } from "@/components";

interface MediaPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  audioRef,
  isPlaying,
  onPlayPause,
}) => {
  const [duration, setDuration] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncFromAudio = () => {
      const safeDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      setDuration(safeDuration);
      setSliderValue(audio.currentTime || 0);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      if (!isDraggingRef.current) {
        setSliderValue(time);
      }
    };

    const handleLoadedMetadata = () => {
      syncFromAudio();
    };

    const handleDurationChange = () => {
      syncFromAudio();
    };

    const handleCanPlay = () => {
      syncFromAudio();
    };

    syncFromAudio();

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioRef]);

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSliderInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const val = parseFloat(e.currentTarget.value);
    setSliderValue(val);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = val;
    }
  }, [audioRef]);

  const accentColor = "#3b82f6";

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 min-w-10 tabular-nums">
          {formatTime(sliderValue)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={sliderValue}
          onInput={handleSliderInput}
          onPointerDown={() => {
            isDraggingRef.current = true;
          }}
          onPointerUp={() => { isDraggingRef.current = false; }}
          onPointerCancel={() => { isDraggingRef.current = false; }}
          onTouchStart={() => { isDraggingRef.current = true; }}
          onTouchEnd={() => { isDraggingRef.current = false; }}
          style={{ accentColor }}
          className="w-full h-10 appearance-none bg-transparent cursor-pointer touch-none
            [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-200
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-blue-500/30 [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-gray-200
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:active:scale-110 [&::-moz-range-thumb]:transition-transform
            dark:[&::-webkit-slider-runnable-track]:bg-slate-700 dark:[&::-moz-range-track]:bg-slate-700"
        />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 min-w-10 text-right tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center items-center">
        <Button
          onClick={onPlayPause}
          icon={isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
      </div>
    </div>
  );
};

export default MediaPlayer;
