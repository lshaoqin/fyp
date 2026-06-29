"use client";

import React from "react";
import { SpeakerLoudIcon, CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { Header } from "@/components";
import type { SavedWord } from "@/utils/saved-words";
import type { TextSettings } from "./SettingsView";

interface SpellingTestViewProps {
  allWords: SavedWord[];
  settings: TextSettings;
  onBackClick: () => void;
  onSettingsClick: () => void;
}

function shuffleAndPick(words: SavedWord[], count: number): SavedWord[] {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getAudioUri(word: SavedWord): string | null {
  const audio = word.audio as Record<string, unknown> | null;
  const fullWord = audio?.full_word as { audio?: string } | undefined;
  if (!fullWord?.audio) return null;
  const mimeType = (audio?.full_word_audio_mime_type as string) || "audio/mp3";
  return `data:${mimeType};base64,${fullWord.audio}`;
}

export const SpellingTestView: React.FC<SpellingTestViewProps> = ({
  allWords,
  settings,
  onBackClick,
  onSettingsClick,
}) => {
  const [testWords] = React.useState(() => shuffleAndPick(allWords, 10));
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [userInput, setUserInput] = React.useState("");
  const [results, setResults] = React.useState<boolean[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [playingAudio, setPlayingAudio] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentWord = testWords[currentIndex];
  const isComplete = currentIndex >= testWords.length;

  React.useEffect(() => {
    if (!submitted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, submitted]);

  const playWordAudio = (uri: string) => {
    setPlayingAudio(true);
    const audio = new Audio(uri);
    audio.onended = () => setPlayingAudio(false);
    audio.onerror = () => setPlayingAudio(false);
    audio.play().catch(() => setPlayingAudio(false));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || !userInput.trim()) return;

    const isCorrect = userInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    const newResults = [...results, isCorrect];
    setResults(newResults);
    setSubmitted(true);
  };

  const handleNext = () => {
    setUserInput("");
    setSubmitted(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const correctCount = results.filter(Boolean).length;

  const handleRestart = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleExit = () => {
    onBackClick();
    onBackClick();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white dark:bg-slate-950">
      <Header onBackClick={handleExit} onSettingsClick={onSettingsClick} fontFamily={settings.fontFamily} />

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-600 mb-6" style={{ fontFamily: settings.fontFamily }}>
            Spelling Test
          </h1>

          {isComplete ? (
            <div className="flex flex-col items-center gap-6 py-12">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: settings.fontFamily }}>
                  {correctCount} / {testWords.length}
                </p>
                <p className="text-base text-gray-600 dark:text-gray-400" style={{ fontFamily: settings.fontFamily }}>
                  {correctCount === testWords.length
                    ? "Perfect score! Well done."
                    : correctCount >= testWords.length * 0.7
                      ? "Great job! Keep practising."
                      : "Keep trying, you&apos;ll get better."}
                </p>
              </div>
              <div className="space-y-3 w-full max-w-md">
                {testWords.map((tw, idx) => {
                  const isCorrect = results[idx];
                  return (
                    <div
                      key={tw.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCorrect
                          ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-950"
                          : "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircledIcon className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <CrossCircledIcon className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white" style={{ fontFamily: settings.fontFamily }}>
                          {tw.word}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: settings.fontFamily }}>
                          {tw.definition}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                  style={{ fontFamily: settings.fontFamily }}
                >
                  Try Again
                </button>
                <button
                  onClick={handleExit}
                  className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-100 font-semibold transition-colors"
                  style={{ fontFamily: settings.fontFamily }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : currentWord ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400" style={{ fontFamily: settings.fontFamily }}>
                  Word {currentIndex + 1} of {testWords.length}
                </span>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400" style={{ fontFamily: settings.fontFamily }}>
                  Score: {correctCount}/{results.length}
                </span>
              </div>

              <div className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-slate-800 p-6">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: settings.fontFamily }}>
                  Definition
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300" style={{ fontFamily: settings.fontFamily }}>
                  {currentWord.definition}
                </p>
                {currentWord.partOfSpeech && (
                  <p className="mt-1 text-sm italic text-gray-500 dark:text-gray-400">
                    {currentWord.partOfSpeech}
                  </p>
                )}
              </div>

              {getAudioUri(currentWord) && (
                <button
                  onClick={() => playWordAudio(getAudioUri(currentWord)!)}
                  disabled={playingAudio}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors disabled:opacity-50 w-fit"
                  style={{ fontFamily: settings.fontFamily }}
                >
                  <SpeakerLoudIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {playingAudio ? "Playing..." : "Hear pronunciation"}
                  </span>
                </button>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={submitted}
                  placeholder="Type the word..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-lg text-center focus:border-blue-500 focus:outline-none disabled:opacity-60"
                />
                {!submitted ? (
                  <button
                    type="submit"
                    disabled={!userInput.trim()}
                    className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold transition-colors"
                    style={{ fontFamily: settings.fontFamily }}
                  >
                    Check
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className={`rounded-lg p-3 text-center font-semibold ${
                      results[results.length - 1]
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
                    }`}>
                      {results[results.length - 1] ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircledIcon className="w-5 h-5" />
                          Correct! The word is <strong>{currentWord.word}</strong>
                        </span>
                      ) : (
                        <span>
                          Incorrect. The correct spelling is <strong>{currentWord.word}</strong>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                      style={{ fontFamily: settings.fontFamily }}
                    >
                      {currentIndex + 1 < testWords.length ? "Next" : "See Results"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SpellingTestView;
