"use client";

import React, { ReactNode } from "react";
import {
  FileTextIcon,
  Share1Icon,
  SpeakerLoudIcon,
  Pencil2Icon,
  BookmarkIcon,
} from "@radix-ui/react-icons";
import { Button, Header, TextViewBox, LoadingSpinner } from "@/components";

interface TextViewProps {
  displayText: string;
  isFormatting: boolean;
  isPlayingAudio: boolean;
  onBackClick: () => void;
  onListen: () => void;
  parseMarkdownText: (text: string) => ReactNode;
}

export const TextView: React.FC<TextViewProps> = ({
  displayText,
  isFormatting,
  isPlayingAudio,
  onBackClick,
  onListen,
  parseMarkdownText,
}) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-white dark:bg-slate-950">
      <Header onBackClick={onBackClick} />

      {/* Text Content */}
      <div className="flex-1 overflow-auto p-8 lg:p-16 flex items-center justify-center">
        {isFormatting ? (
          <LoadingSpinner
            label="Formatting text…"
            size="md"
            color="blue"
          />
        ) : (
          <TextViewBox>{parseMarkdownText(displayText)}</TextViewBox>
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
          onClick={onListen}
          disabled={isPlayingAudio}
          icon={<SpeakerLoudIcon className="w-6 h-6" />}
        >
          {isPlayingAudio ? "Playing..." : "Listen"}
        </Button>
        <Button
          icon={
            <img
              src="/mic.svg"
              alt="Read"
              className="w-6 h-6"
              suppressHydrationWarning
            />
          }
        >
          Read
        </Button>
        <Button icon={<Pencil2Icon className="w-6 h-6" />}>
          Edit
        </Button>
        <Button icon={<BookmarkIcon className="w-6 h-6" />}>
          Notes
        </Button>
      </div>
    </div>
  );
};

export default TextView;
