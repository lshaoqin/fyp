import React, { ReactNode } from "react";
import { ArrowLeftIcon, EnterFullScreenIcon, ExitFullScreenIcon, GearIcon, PersonIcon, BookmarkIcon } from "@radix-ui/react-icons";
import { HelpPopover } from "../HelpPopover/HelpPopover";
import { useFullscreen } from "@/hooks/useFullscreen";

interface HeaderProps {
  onBackClick?: () => void;
  onSettingsClick?: () => void;
  onSavedWordsClick?: () => void;
  showBackButton?: boolean;
  hideBackButton?: boolean;
  showSettings?: boolean;
  showSavedWords?: boolean;
  showProfile?: boolean;
  title?: string;
  borderColor?: "gray" | "blue" | "green" | "none";
  position?: "top" | "bottom";
  children?: ReactNode;
  fontFamily?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onBackClick,
  onSettingsClick,
  onSavedWordsClick,
  showBackButton = true,
  hideBackButton = false,
  showSettings = true,
  showSavedWords = false,
  showProfile = false,
  title,
  borderColor = "gray",
  position = "top",
  children,
  fontFamily = "Verdana, Arial, Helvetica, sans-serif",
}) => {
  const shouldShowBackButton = hideBackButton ? false : showBackButton;
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const borderClasses = {
    gray: "border-b border-gray-200 dark:border-gray-700",
    blue: "border-b border-blue-400 dark:border-blue-700",
    green: "border-b border-green-400 dark:border-green-700",
    none: "",
  };

  return (
    <div
      className={`flex items-center p-6 bg-white dark:bg-slate-900 ${borderClasses[borderColor]}`}
    >
      {/* Left: Back Button or Spacer */}
      <div className="flex-1">
        {shouldShowBackButton && (
          <button
            onClick={onBackClick}
            className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:text-yellow-500 transition-colors"
          >
            <ArrowLeftIcon className="w-7 h-7" />
            <span
              className="text-lg font-bold"
              style={{ fontFamily }}
            >
              Back
            </span>
          </button>
        )}
      </div>

      {/* Center: Title (if provided) */}
      {title && (
        <h2
          className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex-1 text-center"
          style={{ fontFamily }}
        >
          {title}
        </h2>
      )}

      {/* Custom children */}
      {children}

      {/* Right: Settings & Profile Icons */}
      <div className="flex-1 flex justify-end gap-6 items-center">
        <HelpPopover />
        {showSavedWords && onSavedWordsClick && (
          <button onClick={onSavedWordsClick} className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors" aria-label="Saved words">
            <BookmarkIcon className="w-7 h-7" />
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <ExitFullScreenIcon className="w-7 h-7" /> : <EnterFullScreenIcon className="w-7 h-7" />}
        </button>
        {showSettings && (
          <button onClick={onSettingsClick} className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors">
            <GearIcon className="w-7 h-7" />
          </button>
        )}
        {showProfile && (
          <button className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors">
            <PersonIcon className="w-7 h-7" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
