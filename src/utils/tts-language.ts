export type ReaderLanguage = "english" | "mandarin" | "malay" | "tamil";

interface TtsLanguageConfig {
  label: string;
  languageCode: string;
  voiceName: string;
}

export const TTS_LANGUAGE_CONFIG: Record<ReaderLanguage, TtsLanguageConfig> = {
  english: {
    label: "English",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-H",
  },
  mandarin: {
    label: "Mandarin",
    languageCode: "cmn-CN",
    voiceName: "cmn-CN-Standard-A",
  },
  malay: {
    label: "Malay",
    languageCode: "ms-MY",
    voiceName: "ms-MY-Standard-A",
  },
  tamil: {
    label: "Tamil",
    languageCode: "ta-IN",
    voiceName: "ta-IN-Standard-A",
  },
};

export const READER_LANGUAGE_OPTIONS: ReaderLanguage[] = [
  "english",
  "mandarin",
  "malay",
  "tamil",
];

export function getTtsVoiceConfig(language: ReaderLanguage | undefined): TtsLanguageConfig {
  if (language && language in TTS_LANGUAGE_CONFIG) {
    return TTS_LANGUAGE_CONFIG[language as ReaderLanguage];
  }
  return TTS_LANGUAGE_CONFIG.english;
}
