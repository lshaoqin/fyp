export interface SavedWord {
  id: string;
  word: string;
  definition: string;
  partOfSpeech: string;
  exampleSentence: string;
  contextSentence: string;
  syllables: string[];
  illustration: Record<string, unknown> | null;
  audio: Record<string, unknown> | null;
  notes: string;
  savedAt: number;
}

function getLocalSavedWords(): SavedWord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("saved_words_local");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalSavedWords(words: SavedWord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("saved_words_local", JSON.stringify(words));
}

let useOfflineFallback = false;

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("saved_words_auth");
}

export function setSavedWordsAuth(token: string) {
  if (typeof window === "undefined") return;
  useOfflineFallback = false;
  localStorage.setItem("saved_words_auth", token);
  localStorage.removeItem("saved_words_offline");
}

export function clearSavedWordsAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("saved_words_auth");
  localStorage.setItem("saved_words_offline", "1");
  useOfflineFallback = true;
}

export async function listSavedWords(): Promise<SavedWord[]> {
  const token = getAuthToken();

  if (!token || useOfflineFallback) {
    return getLocalSavedWords();
  }

  try {
    const response = await fetch("/api/saved-words", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        useOfflineFallback = true;
      }
      return getLocalSavedWords();
    }
    return (data.words || []) as SavedWord[];
  } catch {
    return getLocalSavedWords();
  }
}

export async function saveWord(wordData: Omit<SavedWord, "id" | "savedAt">): Promise<SavedWord | null> {
  const token = getAuthToken();

  if (!token || useOfflineFallback) {
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const saved: SavedWord = {
      id,
      ...wordData,
      savedAt: Date.now(),
    };
    const existing = getLocalSavedWords();
    existing.unshift(saved);
    setLocalSavedWords(existing);
    return saved;
  }

  try {
    const response = await fetch("/api/saved-words", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(wordData),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        useOfflineFallback = true;
      }
      return null;
    }
    return {
      id: data.id,
      ...wordData,
      savedAt: Date.now(),
    } as SavedWord;
  } catch {
    return null;
  }
}

export async function deleteSavedWord(wordId: string): Promise<boolean> {
  const token = getAuthToken();

  if (!token || useOfflineFallback || wordId.startsWith("local_")) {
    const existing = getLocalSavedWords();
    setLocalSavedWords(existing.filter((w) => w.id !== wordId));
    return true;
  }

  try {
    const response = await fetch(`/api/saved-words/${wordId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function updateSavedWord(
  wordId: string,
  updates: { definition?: string; notes?: string }
): Promise<boolean> {
  const token = getAuthToken();

  if (!token || useOfflineFallback || wordId.startsWith("local_")) {
    const existing = getLocalSavedWords();
    setLocalSavedWords(
      existing.map((w) => (w.id === wordId ? { ...w, ...updates } : w))
    );
    return true;
  }

  try {
    const response = await fetch(`/api/saved-words/${wordId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    return response.ok;
  } catch {
    return false;
  }
}
