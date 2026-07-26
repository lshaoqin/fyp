"use client";

import React from "react";
import { SpeakerLoudIcon, TrashIcon, Pencil1Icon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Header } from "@/components";
import type { SavedWord } from "@/utils/saved-words";
import type { TextSettings } from "./SettingsView";
import type { ReaderLanguage } from "@/utils/tts-language";

interface WordListViewProps {
  words: SavedWord[];
  loading: boolean;
  settings: TextSettings;
  onBackClick: () => void;
  onSettingsClick: () => void;
  onDeleteWord: (wordId: string) => void;
  onUpdateWord: (wordId: string, updates: { definition?: string; notes?: string }) => void;
  onStartSpellingTest: () => void;
  onReadingLanguageChange?: (language: ReaderLanguage) => void;
}

export const WordListView: React.FC<WordListViewProps> = ({
  words,
  loading,
  settings,
  onBackClick,
  onSettingsClick,
  onDeleteWord,
  onUpdateWord,
  onStartSpellingTest,
  onReadingLanguageChange,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [editWordId, setEditWordId] = React.useState<string | null>(null);
  const [editDefinition, setEditDefinition] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");

  const getWordAudioUri = (item: SavedWord): string | null => {
    const audio = item.audio as Record<string, unknown> | null;
    const fullWord = audio?.full_word as { audio?: string } | undefined;
    if (!fullWord?.audio) return null;
    const mimeType = (audio?.full_word_audio_mime_type as string) || "audio/mp3";
    return `data:${mimeType};base64,${fullWord.audio}`;
  };

  const playAudio = (audioUri: string) => {
    const audio = new Audio(audioUri);
    audio.play().catch(() => {});
  };

  const startEdit = (item: SavedWord) => {
    setEditWordId(item.id);
    setEditDefinition(item.definition);
    setEditNotes(item.notes || "");
  };

  const cancelEdit = () => {
    setEditWordId(null);
    setEditDefinition("");
    setEditNotes("");
  };

  const saveEdit = () => {
    if (editWordId) {
      onUpdateWord(editWordId, { definition: editDefinition, notes: editNotes });
    }
    cancelEdit();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white dark:bg-slate-950">
      <Header onBackClick={onBackClick} onSettingsClick={onSettingsClick} fontFamily={settings.fontFamily} readingLanguage={settings.readingLanguage} onReadingLanguageChange={onReadingLanguageChange} />

      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: settings.fontFamily }}>
                Delete saved word?
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400" style={{ fontFamily: settings.fontFamily }}>
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 px-4 rounded-xl text-lg font-semibold bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                style={{ fontFamily: settings.fontFamily }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { onDeleteWord(confirmDeleteId); setConfirmDeleteId(null); }}
                className="flex-1 py-3 px-4 rounded-xl text-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                style={{ fontFamily: settings.fontFamily }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-blue-600" style={{ fontFamily: settings.fontFamily }}>
              Saved Words
            </h1>
            {words.length > 0 && (
              <button
                onClick={onStartSpellingTest}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ fontFamily: settings.fontFamily }}
              >
                Spelling Test
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-base text-gray-600 dark:text-gray-300" style={{ fontFamily: settings.fontFamily }}>
              Loading saved words...
            </p>
          ) : words.length === 0 ? (
            <p className="text-base text-gray-600 dark:text-gray-300" style={{ fontFamily: settings.fontFamily }}>
              No saved words yet. Tap a word while reading to save it.
            </p>
          ) : (
            <div className="space-y-4">
              {words.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 p-4 sm:p-5"
                >
                  {editWordId === item.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: settings.fontFamily }}>
                          {item.word}
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={saveEdit}
                            className="p-2 rounded text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                            title="Save"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                            title="Cancel"
                          >
                            <Cross2Icon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block" style={{ fontFamily: settings.fontFamily }}>
                          Definition
                        </label>
                        <textarea
                          value={editDefinition}
                          onChange={(e) => setEditDefinition(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm resize-y min-h-[60px] focus:border-blue-500 focus:outline-none"
                          style={{ fontFamily: settings.fontFamily }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block" style={{ fontFamily: settings.fontFamily }}>
                          Notes
                        </label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add your own notes..."
                          className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm resize-y min-h-[60px] focus:border-blue-500 focus:outline-none"
                          style={{ fontFamily: settings.fontFamily }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="text-xl font-bold text-gray-900 dark:text-white"
                            style={{ fontFamily: settings.fontFamily }}
                          >
                            {item.word}
                          </h3>
                          {item.partOfSpeech && (
                            <span className="text-sm italic text-gray-500 dark:text-gray-400">
                              {item.partOfSpeech}
                            </span>
                          )}
                        </div>
                        <p
                          className="mt-1 text-base text-gray-700 dark:text-gray-300"
                          style={{ fontFamily: settings.fontFamily }}
                        >
                          {item.definition}
                        </p>
                        {item.notes && (
                          <p
                            className="mt-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-lg p-2"
                            style={{ fontFamily: settings.fontFamily }}
                          >
                            {item.notes}
                          </p>
                        )}
                        {item.contextSentence && (
                          <p
                            className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic"
                            style={{ fontFamily: settings.fontFamily }}
                          >
                            &ldquo;{item.contextSentence}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {getWordAudioUri(item) && (
                          <button
                            onClick={() => playAudio(getWordAudioUri(item)!)}
                            className="p-2 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                            title="Play word"
                          >
                            <SpeakerLoudIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                          className="p-2 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                          title="Edit word"
                        >
                          <Pencil1Icon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.id); }}
                          className="p-2 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="Delete word"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordListView;
