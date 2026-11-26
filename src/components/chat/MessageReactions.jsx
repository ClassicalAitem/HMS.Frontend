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
      className={`absolute z-50 flex items-center gap-2 p-2 bg-base-100 rounded-full shadow-2xl border border-base-300 animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-2.5rem)] select-none ${
        position === "top" ? "bottom-full mb-2" : "top-full mt-2"
      } ${align === "end" ? "right-0" : "left-0"}`}
      style={{
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
      }}
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
          className="w-11 h-11 flex items-center justify-center text-2xl rounded-full hover:bg-base-200 hover:scale-125 active:scale-110 transition cursor-pointer shrink-0"
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

  // Strict one reaction per user deduplication: if a user reacted multiple times, only their latest reaction counts
  const userLatestMap = new Map();
  reactions.forEach((r) => {
    if (!r || !r.emoji) return;
    const uid = r.userId || r.userName || "anonymous";
    userLatestMap.set(uid, r);
  });
  const uniqueReactions = Array.from(userLatestMap.values());

  // Group deduplicated reactions by emoji
  const grouped = {};
  uniqueReactions.forEach((r) => {
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
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer select-none shadow-sm hover:scale-105 active:scale-95 ${
              group.hasReacted
                ? "bg-primary/20 border-primary/60 text-primary ring-1 ring-primary/40 shadow-xs"
                : "bg-base-200/90 border-base-300 text-base-content hover:bg-base-300"
            }`}
          >
            <span className="text-xl leading-none">{group.emoji}</span>
            <span className="text-xs leading-none font-black">{group.count}</span>
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
          className="w-8 h-8 flex items-center justify-center text-base-content/60 hover:text-primary hover:bg-base-200/90 rounded-full border border-base-300 transition cursor-pointer shadow-xs"
          title="Add reaction"
        >
          <FaPlus className="text-xs" />
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
