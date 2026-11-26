import React, { useRef, useEffect } from "react";
import { FaPlus } from "react-icons/fa";

export const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"];

/**
 * Floating Emoji Reaction Picker Popup
 */
export const MessageReactionPicker = ({
  isOpen,
  onClose,
  onSelectEmoji,
  position = "top",
  align = "start",
}) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className={`absolute z-30 flex items-center gap-1.5 p-1.5 bg-base-100 rounded-full shadow-2xl border border-base-300 animate-in fade-in zoom-in-95 duration-100 max-w-[calc(100vw-2rem)] select-none ${
        position === "top" ? "bottom-full mb-2" : "top-full mt-2"
      } ${align === "end" ? "right-0" : "left-0"}`}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectEmoji(emoji);
            onClose();
          }}
          className="w-9 h-9 flex items-center justify-center text-xl rounded-full hover:bg-base-200 hover:scale-125 active:scale-110 transition cursor-pointer"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

/**
 * Reaction Badges Display under Message Bubble
 */
export const MessageReactionBadges = ({
  reactions = [],
  currentUserId,
  onToggleReaction,
  onOpenPicker,
  align = "start",
}) => {
  if (!Array.isArray(reactions) || reactions.length === 0) return null;

  // Group reactions by emoji
  const grouped = {};
  reactions.forEach((r) => {
    if (!r.emoji) return;
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = {
        emoji: r.emoji,
        count: 0,
        userNames: [],
        hasReacted: false,
      };
    }
    grouped[r.emoji].count += 1;
    if (r.userName) grouped[r.emoji].userNames.push(r.userName);
    if (r.userId === currentUserId) {
      grouped[r.emoji].hasReacted = true;
    }
  });

  const list = Object.values(grouped);
  if (list.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 mt-1.5 ${
        align === "end" ? "justify-end" : "justify-start"
      }`}
    >
      {list.map((group) => {
        const tooltip = group.userNames.join(", ");
        return (
          <button
            key={group.emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleReaction(group.emoji);
            }}
            title={tooltip}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer select-none shadow-2xs hover:scale-105 active:scale-95 ${
              group.hasReacted
                ? "bg-primary/20 border-primary/50 text-primary font-bold ring-1 ring-primary/30"
                : "bg-base-200/90 border-base-300 text-base-content/85 hover:bg-base-300"
            }`}
          >
            <span className="text-base leading-none">{group.emoji}</span>
            <span className="text-xs leading-none font-bold">{group.count}</span>
          </button>
        );
      })}
      {onOpenPicker && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPicker();
          }}
          className="w-7 h-7 flex items-center justify-center text-base-content/50 hover:text-primary hover:bg-base-200/80 rounded-full border border-base-300/60 transition cursor-pointer shadow-2xs"
          title="Add reaction"
        >
          <FaPlus className="text-[10px]" />
        </button>
      )}
    </div>
  );
};

export default {
  QUICK_EMOJIS,
  MessageReactionPicker,
  MessageReactionBadges,
};
