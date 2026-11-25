import { useState, useEffect, useCallback, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { connectSocket, getSocket } from "@/services/socket";
import chatAPI from "@/services/api/chatAPI";

// Play a subtle web audio beep for incoming messages
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext blocked or not supported
  }
};

export const useChatSocket = (activeConversationId = null) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const activeConvRef = useRef(activeConversationId);

  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatAPI.getUnreadSummary();
      const count = res?.data?.unreadConversationsCount || 0;
      setUnreadCount(count);
    } catch {
      // Ignore background fetch failure
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const role = (user.role || user.accountType || "").toLowerCase().trim().replace(/_/g, "-");
    const userId = user.id || user._id;

    if (!userId) return;

    // Connect and register
    connectSocket({ userId, role });
    refreshUnreadCount();

    const socket = getSocket();

    const handleNewMessage = (payload) => {
      const msg = payload?.message;
      const convId = payload?.conversation?.id || msg?.conversationId;

      // If the user isn't currently viewing this exact conversation, trigger chime & increment unread
      if (activeConvRef.current !== convId) {
        playNotificationSound();
        setUnreadCount((c) => c + 1);
      }

      // Dispatch global DOM event so active views can update seamlessly
      window.dispatchEvent(
        new CustomEvent("hms:chat-new-message", { detail: payload })
      );
    };

    const handleMessageEdited = (payload) => {
      window.dispatchEvent(
        new CustomEvent("hms:chat-message-edited", { detail: payload })
      );
    };

    const handleMessageDeleted = (payload) => {
      window.dispatchEvent(
        new CustomEvent("hms:chat-message-deleted", { detail: payload })
      );
    };

    socket.on("chat:new_message", handleNewMessage);
    socket.on("chat:message", handleNewMessage);
    socket.on("chat:message_edited", handleMessageEdited);
    socket.on("chat:message_deleted", handleMessageDeleted);

    return () => {
      socket.off("chat:new_message", handleNewMessage);
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:message_edited", handleMessageEdited);
      socket.off("chat:message_deleted", handleMessageDeleted);
    };
  }, [isAuthenticated, user, refreshUnreadCount]);

  return {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount,
  };
};

export default useChatSocket;
