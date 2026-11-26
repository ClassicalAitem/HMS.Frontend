import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import chatAPI from "@/services/api/chatAPI";
import { getSocket } from "@/services/socket";
import StaffDirectoryModal from "./StaffDirectoryModal";
import BroadcastModal from "./BroadcastModal";
import CreateGroupModal from "./CreateGroupModal";
import PatientTagSelector from "./PatientTagSelector";
import MessageInfoModal from "./MessageInfoModal";
import { MessageReactionPicker, MessageReactionBadges } from "./MessageReactions";
import {
  FaTimes,
  FaPaperPlane,
  FaComments,
  FaUsers,
  FaBullhorn,
  FaUserPlus,
  FaArrowLeft,
  FaExpandAlt,
  FaSpinner,
  FaExclamationCircle,
  FaReply,
  FaAt,
  FaHospitalUser,
  FaPencilAlt,
  FaTrashAlt,
  FaBan,
  FaSearch,
  FaSmile,
  FaCheckDouble,
  FaInfoCircle,
} from "react-icons/fa";

const renderMessageContent = (content, highlight = "") => {
  if (!content) return "";
  const parts = content.split(/(@[a-zA-Z0-9_-]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={idx}
          className="font-bold underline text-primary bg-primary/10 px-1 py-0.5 rounded-sm mx-0.5 inline-block"
        >
          {part}
        </span>
      );
    }
    if (highlight && highlight.trim()) {
      const q = highlight.trim().toLowerCase();
      const escaped = q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const subParts = part.split(new RegExp(`(${escaped})`, "gi"));
      return subParts.map((sub, sIdx) => {
        if (sub.toLowerCase() === q) {
          return (
            <mark key={sIdx} className="bg-warning text-black px-0.5 rounded-xs font-semibold">
              {sub}
            </mark>
          );
        }
        return sub;
      });
    }
    return part;
  });
};

const PRIVILEGED_ROLES = new Set([
  "super-admin",
  "superadmin",
  "super_admin",
  "super admin",
  "admin",
  "hr",
  "human-resource",
  "human_resource",
  "human resources",
  "human-resources",
  "medical-director",
  "medical_director",
  "medical director",
]);

const MANAGEMENT_ROLES = new Set([
  "super-admin",
  "superadmin",
  "super_admin",
  "super admin",
  "admin",
  "hr",
  "human-resource",
  "human_resource",
  "human resources",
  "human-resources",
]);

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatDateDivider = (dateStr) => {
  if (!dateStr) return "";
  try {
    const msgDate = new Date(dateStr);
    if (isNaN(msgDate.getTime())) return "";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(msgDate, today)) {
      return "Today";
    }
    if (isSameDay(msgDate, yesterday)) {
      return "Yesterday";
    }

    return msgDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: msgDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
};

const isDifferentDay = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return true;
  try {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;
    return (
      d1.getFullYear() !== d2.getFullYear() ||
      d1.getMonth() !== d2.getMonth() ||
      d1.getDate() !== d2.getDate()
    );
  } catch {
    return true;
  }
};

const getConvTitle = (conv) => conv?.title || conv?.otherUser?.name || "Direct Chat";
const getConvInitial = (conv) => {
  const title = getConvTitle(conv);
  return title ? title.charAt(0).toUpperCase() : "C";
};

export const ChatDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const currentUserId = user?.id || user?._id;
  const rawUserRole = String(user?.role || user?.accountType || "").toLowerCase().trim();
  const userRole = rawUserRole.replace(/[\s_]+/g, "-");
  const isPrivileged = PRIVILEGED_ROLES.has(userRole) || PRIVILEGED_ROLES.has(rawUserRole);
  const isManagementRole = MANAGEMENT_ROLES.has(userRole) || MANAGEMENT_ROLES.has(rawUserRole);

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'roles' | 'direct' | 'broadcast'
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  // Reply, Edit, Search and Mentions state
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showSearchChat, setShowSearchChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [conversationMembers, setConversationMembers] = useState([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const [selectedInfoMsg, setSelectedInfoMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversations
  const loadConversations = async () => {
    setLoadingConv(true);
    try {
      const res = await chatAPI.getConversations();
      const list = res?.data || [];
      const sanitized = isManagementRole ? list.filter((c) => c.type !== "direct") : list;
      setConversations(sanitized);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // Load messages for selected conversation
  const loadMessages = async (convId) => {
    setLoadingMessages(true);
    try {
      const res = await chatAPI.getMessages(convId);
      setMessages(res?.data?.messages || []);

      // Join socket room
      const socket = getSocket();
      socket.emit("chat:join", { conversationId: convId });

      // Mark as read locally in conversation list
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, isUnread: false } : c))
      );
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConv(conv);
    setReplyingTo(null);
    setEditingMessage(null);
    setShowMentionMenu(false);
    setShowSearchChat(false);
    setChatSearchQuery("");
    loadMessages(conv.id);
  };

  useEffect(() => {
    if (selectedConv) {
      chatAPI.getConversationMembers(selectedConv.id)
        .then((res) => setConversationMembers(res?.data || []))
        .catch(() => setConversationMembers([]));
    } else {
      setConversationMembers([]);
    }
  }, [selectedConv?.id]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen to incoming messages in real-time
  useEffect(() => {
    const handleGlobalMessage = (e) => {
      const payload = e.detail;
      const newMsg = payload?.message;
      const convId = payload?.conversation?.id || newMsg?.conversationId;

      if (!newMsg) return;

      // Update active thread
      if (selectedConv && selectedConv.id === convId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      // Update conversations list snippet
      let needsReload = false;
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convId);
        if (exists) {
          return prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessageText: newMsg.content,
                  lastMessageAt: newMsg.createdAt,
                  lastSenderName: newMsg.senderName,
                  isUnread: selectedConv?.id === convId ? false : true,
                }
              : c
          );
        } else {
          needsReload = true;
          return prev;
        }
      });
      if (needsReload) {
        loadConversations();
      }
    };

    window.addEventListener("hms:chat-new-message", handleGlobalMessage);

    const handleRemoteEdit = (e) => {
      const updatedMsg = e.detail?.message;
      if (!updatedMsg) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
      );
    };

    const handleRemoteDelete = (e) => {
      const { messageId } = e.detail || {};
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: "This message was deleted" }
            : m
        )
      );
    };

    const handleRemoteReaction = (e) => {
      const { messageId, reactions } = e.detail || {};
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleRemoteMessagesRead = (e) => {
      const { conversationId, userId, userName, userRole, readAt, messageIds } = e.detail || {};
      if (!conversationId || !messageIds || !Array.isArray(messageIds)) return;
      if (selectedConv && selectedConv.id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (!messageIds.includes(m.id)) return m;
            let currentReadBy = Array.isArray(m.readBy) ? [...m.readBy] : [];
            if (!currentReadBy.some((r) => r.userId === userId)) {
              currentReadBy.push({ userId, userName, userRole, readAt });
            }
            return { ...m, readBy: currentReadBy };
          })
        );
      }
    };

    window.addEventListener("hms:chat-message-edited", handleRemoteEdit);
    window.addEventListener("hms:chat-message-deleted", handleRemoteDelete);
    window.addEventListener("hms:chat-message-reaction", handleRemoteReaction);
    window.addEventListener("hms:chat-messages-read", handleRemoteMessagesRead);

    // Socket typing listeners
    const socket = getSocket();
    const handleTyping = ({ conversationId, userName, userId }) => {
      if (selectedConv?.id === conversationId && userId !== currentUserId) {
        setTypingUser(userName);
      }
    };
    const handleStopTyping = ({ conversationId, userId }) => {
      if (selectedConv?.id === conversationId && userId !== currentUserId) {
        setTypingUser(null);
      }
    };

    socket.on("chat:typing", handleTyping);
    socket.on("chat:stop_typing", handleStopTyping);

    return () => {
      window.removeEventListener("hms:chat-new-message", handleGlobalMessage);
      window.removeEventListener("hms:chat-message-edited", handleRemoteEdit);
      window.removeEventListener("hms:chat-message-deleted", handleRemoteDelete);
      window.removeEventListener("hms:chat-message-reaction", handleRemoteReaction);
      window.removeEventListener("hms:chat-messages-read", handleRemoteMessagesRead);
      socket.off("chat:typing", handleTyping);
      socket.off("chat:stop_typing", handleStopTyping);
    };
  }, [selectedConv, currentUserId]);

  const handleToggleReaction = async (messageId, emoji) => {
    try {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          let currentReactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
          const userIdx = currentReactions.findIndex((r) => r.userId === currentUserId);
          if (userIdx > -1) {
            if (currentReactions[userIdx].emoji === emoji) {
              currentReactions.splice(userIdx, 1);
            } else {
              currentReactions[userIdx] = {
                emoji,
                userId: currentUserId,
                userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Staff",
              };
            }
          } else {
            currentReactions.push({
              emoji,
              userId: currentUserId,
              userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Staff",
            });
          }
          return { ...m, reactions: currentReactions };
        })
      );
      await chatAPI.toggleReaction(messageId, emoji);
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  const handleStartEdit = (msg) => {
    const diffMins = (Date.now() - new Date(msg.createdAt).getTime()) / (1000 * 60);
    if (diffMins > 10) {
      alert("Messages can only be edited within the first 10 minutes of sending.");
      return;
    }
    setReplyingTo(null);
    setEditingMessage(msg);
    setInputText(msg.content);
    messageInputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInputText("");
  };

  const handleDeleteMessage = async (msgId) => {
    const targetMsg = messages.find((m) => m.id === msgId);
    if (targetMsg) {
      const diffMins = (Date.now() - new Date(targetMsg.createdAt).getTime()) / (1000 * 60);
      if (diffMins > 10) {
        alert("Messages can only be deleted within the first 10 minutes of sending.");
        return;
      }
    }
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await chatAPI.deleteMessage(msgId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, isDeleted: true, content: "This message was deleted" }
            : m
        )
      );
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to delete message";
      alert(errorMsg);
      console.error("Failed to delete message:", err);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending || !selectedConv) return;

    if (editingMessage) {
      const newText = inputText.trim();
      setSending(true);
      try {
        const res = await chatAPI.editMessage(editingMessage.id, newText);
        const updated = res?.data?.message;
        if (updated) {
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
        setEditingMessage(null);
        setInputText("");
      } catch (err) {
        const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to edit message";
        alert(errorMsg);
        console.error("Failed to edit message:", err);
      } finally {
        setSending(false);
      }
      return;
    }

    const content = inputText.trim();
    const patientTag = selectedPatient?.tag || selectedPatient?.name;
    const currentReply = replyingTo;

    setInputText("");
    setSelectedPatient(null);
    setReplyingTo(null);
    setShowMentionMenu(false);
    setSending(true);

    if (messageInputRef.current) {
      messageInputRef.current.style.height = "auto";
    }

    try {
      const socket = getSocket();
      socket.emit("chat:stop_typing", {
        conversationId: selectedConv.id,
        userId: currentUserId,
      });

      // Extract @mentions
      const mentionMatches = content.match(/@([a-zA-Z0-9_-]+)/g);
      let mentionedUserIds = [];
      if (mentionMatches && conversationMembers.length > 0) {
        const tags = mentionMatches.map((m) => m.slice(1).toLowerCase());
        mentionedUserIds = conversationMembers
          .filter(
            (m) =>
              tags.includes(m.username?.toLowerCase()) ||
              tags.includes(m.name?.toLowerCase().split(" ")[0])
          )
          .map((m) => m.id);
      }

      const res = await chatAPI.sendMessage({
        conversationId: selectedConv.id,
        content,
        patientRefId: patientTag || undefined,
        replyToMessageId: currentReply?.id || undefined,
        replyToSenderName: currentReply?.senderName || undefined,
        replyToContent: currentReply?.content || undefined,
        mentions: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      });

      const sentMsg = res?.data?.message;
      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Auto-adjust height up to max 120px
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    // Detect @mention trigger in group chat
    const cursor = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

    if (mentionMatch && conversationMembers.length > 0) {
      setShowMentionMenu(true);
      setMentionQuery(mentionMatch[1].toLowerCase());
    } else {
      setShowMentionMenu(false);
    }

    if (!selectedConv) return;

    const socket = getSocket();
    socket.emit("chat:typing", {
      conversationId: selectedConv.id,
      userId: currentUserId,
      userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Staff",
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:stop_typing", {
        conversationId: selectedConv.id,
        userId: currentUserId,
      });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    // Shift + Enter: Allow natural newline in textarea
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }
    // Enter without Shift: Send message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((inputText.trim() || selectedPatient) && !sending) {
        handleSendMessage(e);
      }
    }
  };

  const handleSelectMention = (member) => {
    const usernameTag = `@${member.username || member.name.toLowerCase().split(" ")[0]} `;
    const updated = inputText.replace(/@([a-zA-Z0-9_-]*)$/, usernameTag);
    setInputText(updated);
    setShowMentionMenu(false);
    setTimeout(() => messageInputRef.current?.focus(), 50);
  };

  const handleStartDirectChat = async (staff) => {
    try {
      const res = await chatAPI.getOrCreateDirectConversation(staff.id);
      const conv = res?.data;
      if (conv) {
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conv.id);
          return exists ? prev : [conv, ...prev];
        });
        handleSelectConversation(conv);
        setTimeout(() => messageInputRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error("Failed to open direct chat:", err);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (isManagementRole && c.type === "direct") return false;
    if (activeTab === "roles") return c.type === "role_group" || c.type === "group";
    if (activeTab === "direct") return !isManagementRole && c.type === "direct";
    if (activeTab === "broadcast") return c.type === "broadcast";
    return true;
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300">
        <div className="w-full max-w-md h-full bg-base-100 shadow-2xl border-l border-base-300 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-200/50">
            <div className="flex items-center gap-2">
              {selectedConv ? (
                <button
                  onClick={() => setSelectedConv(null)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/70 hover:text-base-content"
                  title="Back to conversations"
                >
                  <FaArrowLeft />
                </button>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs">
                  <FaComments />
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold text-base-content leading-tight">
                  {selectedConv ? getConvTitle(selectedConv) : "Hospital Communications"}
                </h3>
                <p className="text-[11px] font-medium text-base-content/75 leading-none">
                  {selectedConv
                    ? selectedConv.type === "role_group"
                      ? selectedConv.targetRole === "nurse" && (userRole === "doctor" || userRole === "surgeon")
                        ? "⚡ Emergency Channel (Doctors & Nurses)"
                        : selectedConv.targetRole === "doctor" && userRole === "nurse"
                        ? "⚡ Emergency Channel (Nurses & Doctors)"
                        : `Department Channel: ${selectedConv.targetRole || "Role"}`
                      : selectedConv.type === "group"
                      ? "Custom Team / Committee Group"
                      : selectedConv.type === "broadcast"
                      ? "Official Broadcast"
                      : "Direct Message"
                    : "Instant messaging & role broadcasts"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {selectedConv && (
                <button
                  onClick={() => setShowSearchChat((prev) => !prev)}
                  className={`btn btn-ghost btn-circle btn-xs ${
                    showSearchChat ? "text-primary bg-primary/10" : "text-base-content/60"
                  } hover:text-base-content`}
                  title="Search messages in this conversation"
                >
                  <FaSearch className="text-[11px]" />
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  navigate("/messages");
                }}
                className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
                title="Full Page Mode"
              >
                <FaExpandAlt className="text-xs" />
              </button>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Collapsible In-Chat Search Bar */}
          {selectedConv && showSearchChat && (
            <div className="px-3 py-2 bg-base-200/90 border-b border-base-300 flex items-center gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40 text-[10px]" />
                <input
                  type="text"
                  placeholder="Search in chat..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="input input-xs w-full pl-7 pr-6 bg-base-100 border border-base-300 rounded-lg text-xs"
                  autoFocus
                />
                {chatSearchQuery && (
                  <button
                    onClick={() => setChatSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content text-[10px]"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {chatSearchQuery.trim() && (
                <span className="text-[10px] text-base-content/50 font-medium shrink-0">
                  {
                    messages.filter(
                      (m) =>
                        !m.isDeleted &&
                        m.content?.toLowerCase().includes(chatSearchQuery.trim().toLowerCase())
                    ).length
                  }{" "}
                  found
                </span>
              )}
            </div>
          )}

          {/* Body: Conversation List OR Active Chat */}
          {!selectedConv ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Actions (New DM, Group & Broadcast) */}
              <div className="p-3 border-b border-base-200 flex items-center gap-2">
                {!isManagementRole && (
                  <button
                    onClick={() => setShowStaffModal(true)}
                    className="btn btn-sm btn-outline btn-primary flex-1 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs"
                  >
                    <FaUserPlus className="text-xs" /> New Chat
                  </button>
                )}
                {isPrivileged && (
                  <>
                    <button
                      onClick={() => setShowGroupModal(true)}
                      className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white flex-1 rounded-xl text-xs font-bold gap-1 shadow-2xs border-0"
                      title="Create Group"
                    >
                      <FaUsers className="text-xs" /> New Group
                    </button>
                    <button
                      onClick={() => setShowBroadcastModal(true)}
                      className="btn btn-sm bg-amber-600 hover:bg-amber-700 text-white flex-1 rounded-xl text-xs font-bold gap-1 shadow-2xs border-0"
                      title="Post Broadcast"
                    >
                      <FaBullhorn className="text-xs" /> Broadcast
                    </button>
                  </>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-base-200 bg-base-200/50 px-2 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`py-2 px-3 border-b-2 transition ${
                    activeTab === "all"
                      ? "border-primary text-primary"
                      : "border-transparent text-base-content/70 hover:text-base-content"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("roles")}
                  className={`py-2 px-3 border-b-2 transition ${
                    activeTab === "roles"
                      ? "border-primary text-primary"
                      : "border-transparent text-base-content/70 hover:text-base-content"
                  }`}
                >
                  Groups
                </button>
                {!isManagementRole && (
                  <button
                    onClick={() => setActiveTab("direct")}
                    className={`py-2 px-3 border-b-2 transition ${
                      activeTab === "direct"
                        ? "border-primary text-primary"
                        : "border-transparent text-base-content/70 hover:text-base-content"
                    }`}
                  >
                    Direct
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("broadcast")}
                  className={`py-2 px-3 border-b-2 transition ${
                    activeTab === "broadcast"
                      ? "border-primary text-primary"
                      : "border-transparent text-base-content/70 hover:text-base-content"
                  }`}
                >
                  Broadcasts
                </button>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loadingConv ? (
                  <div className="flex items-center justify-center py-12 text-xs text-base-content/50 gap-2">
                    <FaSpinner className="animate-spin text-primary" /> Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 text-xs text-base-content/50 space-y-1">
                    <p>No conversations found</p>
                    <button
                      onClick={() => setShowStaffModal(true)}
                      className="text-primary hover:underline text-xs"
                    >
                      Start a chat with a colleague
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isGroup = conv.type === "role_group" || conv.type === "group";
                    const isBroadcast = conv.type === "broadcast";

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition text-left group border ${
                          conv.isUnread
                            ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                            : "hover:bg-base-200/80 border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-bold text-xs uppercase border ${
                              isBroadcast
                                ? "bg-warning/10 text-warning border-warning/30"
                                : isGroup
                                ? "bg-secondary/10 text-secondary border-secondary/30"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            {isBroadcast ? (
                              <FaBullhorn />
                            ) : isGroup ? (
                              <FaUsers />
                            ) : (
                              getConvInitial(conv)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-base-content truncate group-hover:text-primary transition">
                                {getConvTitle(conv)}
                              </span>
                              {conv.isUnread && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs text-base-content/75 font-medium truncate mt-0.5">
                              {conv.lastSenderName ? (
                                <span className="font-semibold text-base-content/90">{conv.lastSenderName}: </span>
                              ) : ""}
                              {conv.lastMessageText || "No messages yet"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span className="text-[11px] font-semibold text-base-content/65">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Active Chat View */
            <div className="flex-1 flex flex-col overflow-hidden bg-base-200/20">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2.5">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12 text-xs text-base-content/50 gap-2">
                    <FaSpinner className="animate-spin text-primary" /> Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-base-content/50">
                    No messages yet in this conversation. Say hello!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUserId;
                    const msgAgeMinutes = (Date.now() - new Date(msg.createdAt).getTime()) / (1000 * 60);
                    const isWithin10Mins = msgAgeMinutes <= 10;
                    const canEdit = (isMe || isPrivileged) && !msg.isDeleted && isWithin10Mins;
                    const canDelete = (isMe || isPrivileged) && !msg.isDeleted && isWithin10Mins;
                    const isUrgent = msg.messageType === "urgent";
                    const isAnnouncement = msg.messageType === "announcement";
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const showDateDivider = !prevMsg || isDifferentDay(prevMsg.createdAt, msg.createdAt);

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-2.5 select-none">
                            <div className="flex-1 h-px bg-base-300/80" />
                            <span className="mx-2 px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide bg-base-200 text-base-content/70 shadow-2xs border border-base-300">
                              {formatDateDivider(msg.createdAt)}
                            </span>
                            <div className="flex-1 h-px bg-base-300/80" />
                          </div>
                        )}
                        <div
                          className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
                        >
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[11px] font-bold text-base-content/80">
                              {msg.senderName}
                            </span>
                            <span className="badge badge-xs badge-ghost text-[9px] uppercase tracking-wider">
                              {msg.senderRole ? msg.senderRole.replace(/-/g, " ") : "Staff"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 max-w-[85%] relative">
                          {isMe && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0 bg-base-100/95 backdrop-blur-md border border-base-300 shadow-md px-2 py-1 rounded-full">
                              {!msg.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-primary hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Add reaction"
                                >
                                  <FaSmile className="text-base" />
                                </button>
                              )}
                              {!msg.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedInfoMsg(msg)}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-info hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Message Info"
                                >
                                  <FaInfoCircle className="text-sm" />
                                </button>
                              )}
                              {!msg.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo({
                                      id: msg.id,
                                      senderName: msg.senderName,
                                      content: msg.content,
                                    });
                                    messageInputRef.current?.focus();
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-primary hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Reply to message"
                                >
                                  <FaReply className="text-sm" />
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-warning hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Edit message"
                                >
                                  <FaPencilAlt className="text-sm" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-error hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Delete message"
                                >
                                  <FaTrashAlt className="text-sm" />
                                </button>
                              )}
                            </div>
                          )}

                          {(() => {
                            const isSpecial = isUrgent || isAnnouncement;
                            return (
                              <div
                                className={`rounded-2xl p-2.5 shadow-xs text-xs relative flex-1 ${
                                  msg.isDeleted
                                    ? "bg-base-200/70 border border-base-300 text-base-content/50"
                                    : isUrgent
                                    ? "bg-amber-500/15 border border-amber-500/40 text-amber-950 dark:text-amber-100 shadow-xs"
                                    : isAnnouncement
                                    ? "bg-blue-500/15 border border-blue-500/40 text-blue-950 dark:text-blue-100 shadow-xs"
                                    : isMe
                                    ? "bg-primary text-primary-content rounded-br-none"
                                    : "bg-base-100 border border-base-300 text-base-content rounded-bl-none"
                                }`}
                              >
                                {/* Reply Quote Banner */}
                                {msg.replyToContent && !msg.isDeleted && (
                                  <div
                                    className={`mb-1.5 pl-2 border-l-2 text-[10px] p-1 rounded-r-lg ${
                                      isMe && !isSpecial
                                        ? "border-white/80 bg-black/15 text-white/90"
                                        : isUrgent
                                        ? "border-amber-600 bg-amber-500/20 text-amber-950 dark:text-amber-100"
                                        : isAnnouncement
                                        ? "border-blue-600 bg-blue-500/20 text-blue-950 dark:text-blue-100"
                                        : "border-primary bg-primary/10 text-base-content/80"
                                    }`}
                                  >
                                    <div className="font-bold flex items-center gap-1">
                                      <FaReply className="text-[8px]" /> {msg.replyToSenderName || "Staff"}
                                    </div>
                                    <p className="truncate opacity-80">{msg.replyToContent}</p>
                                  </div>
                                )}

                                {isUrgent && !msg.isDeleted && (
                                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-400 mb-1.5 uppercase tracking-wider">
                                    <FaExclamationCircle /> Urgent Directive
                                  </div>
                                )}

                                {isAnnouncement && !msg.isDeleted && (
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-1.5 uppercase tracking-wider">
                                    <FaBullhorn /> Hospital Announcement
                                  </div>
                                )}

                                {msg.patientRefId && !msg.isDeleted && (
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold mb-1.5 border shadow-2xs ${
                                      isUrgent
                                        ? "bg-amber-200/90 text-amber-950 border-amber-400 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700"
                                        : isAnnouncement
                                        ? "bg-blue-200/90 text-blue-950 border-blue-400 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-700"
                                        : isMe
                                        ? "bg-white/20 text-white border-white/30 backdrop-blur-xs"
                                        : "bg-primary/10 text-primary border-primary/20"
                                    }`}
                                  >
                                    <FaHospitalUser className={`text-[11px] ${isUrgent ? "text-amber-800 dark:text-amber-400" : isAnnouncement ? "text-blue-700 dark:text-blue-400" : ""}`} />
                                    <span>Patient: {msg.patientRefId}</span>
                                  </div>
                                )}

                                {msg.isDeleted ? (
                                  <p className="italic text-[11px] opacity-60 flex items-center gap-1.5 py-0.5">
                                    <FaBan className="text-[10px]" /> This message was deleted
                                  </p>
                                ) : (
                                  <p className={`whitespace-pre-wrap leading-relaxed ${isUrgent ? "font-medium text-amber-950 dark:text-amber-100" : isAnnouncement ? "font-medium text-blue-950 dark:text-blue-100" : ""}`}>
                                    {renderMessageContent(msg.content, chatSearchQuery)}
                                  </p>
                                )}

                                <div
                                  className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                                    isUrgent
                                      ? "text-amber-900/70 dark:text-amber-300/70 font-semibold"
                                      : isAnnouncement
                                      ? "text-blue-900/70 dark:text-blue-300/70 font-medium"
                                      : isMe && !msg.isDeleted
                                      ? "text-primary-content/75"
                                      : "text-base-content/50"
                                  }`}
                                >
                                  {msg.isEdited && !msg.isDeleted && (
                                    <span className="italic opacity-70 text-[8px]">(edited)</span>
                                  )}
                                  <span>{formatTime(msg.createdAt)}</span>
                                  {isMe && !msg.isDeleted && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedInfoMsg(msg);
                                      }}
                                      className="cursor-pointer hover:scale-115 transition inline-flex items-center ml-0.5"
                                      title={
                                        Array.isArray(msg.readBy) && msg.readBy.some((r) => r.userId !== currentUserId)
                                          ? "Read by recipient(s) - Click for info"
                                          : "Delivered - Click for info"
                                      }
                                    >
                                      {Array.isArray(msg.readBy) && msg.readBy.some((r) => r.userId !== currentUserId) ? (
                                        <FaCheckDouble className="text-sky-400 text-[10px]" />
                                      ) : (
                                        <FaCheckDouble className="opacity-55 text-[10px]" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {!isMe && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0 bg-base-100/95 backdrop-blur-md border border-base-300 shadow-md px-2 py-1 rounded-full">
                              {!msg.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-primary hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Add reaction"
                                >
                                  <FaSmile className="text-base" />
                                </button>
                              )}
                              {!msg.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedInfoMsg(msg)}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-info hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Message Info"
                                >
                                  <FaInfoCircle className="text-sm" />
                                </button>
                              )}
                              {!msg.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo({
                                      id: msg.id,
                                      senderName: msg.senderName,
                                      content: msg.content,
                                    });
                                    messageInputRef.current?.focus();
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-primary hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Reply to message"
                                >
                                  <FaReply className="text-sm" />
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-warning hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Edit message"
                                >
                                  <FaPencilAlt className="text-sm" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="w-8 h-8 flex items-center justify-center text-base-content/70 hover:text-error hover:bg-base-200 rounded-full transition cursor-pointer"
                                  title="Delete message"
                                >
                                  <FaTrashAlt className="text-sm" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Reaction Picker Popup */}
                        <div className={`relative w-full flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className="relative">
                            <MessageReactionPicker
                              isOpen={reactionPickerMsgId === msg.id}
                              onClose={() => setReactionPickerMsgId(null)}
                              onSelectEmoji={(emoji) => handleToggleReaction(msg.id, emoji)}
                              position="top"
                              align={isMe ? "end" : "start"}
                            />
                          </div>
                        </div>

                        {/* Reaction Badges */}
                        <MessageReactionBadges
                          reactions={msg.reactions}
                          currentUserId={currentUserId}
                          onToggleReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
                          onOpenPicker={() => setReactionPickerMsgId(msg.id)}
                          align={isMe ? "end" : "start"}
                        />
                      </div>
                    </React.Fragment>
                  );
                })
                )}
                {typingUser && (
                  <div className="text-[11px] text-base-content/50 italic px-2">
                    {typingUser} is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              {!isPrivileged && selectedConv.type === "broadcast" ? (
                <div className="p-3 border-t border-base-300 bg-base-200/50 text-center text-[11px] text-base-content/60 font-medium">
                  📢 Read-only channel. Only Management can post announcements.
                </div>
              ) : (
                <div className="border-t border-base-300 bg-base-100 flex flex-col relative">
                  {/* Replying Banner */}
                  {replyingTo && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-base-200/90 border-b border-base-300 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FaReply className="text-primary text-[10px] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-semibold text-primary">{replyingTo.senderName}: </span>
                          <span className="text-base-content/70 truncate">{replyingTo.content}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="btn btn-ghost btn-circle btn-xs text-base-content/50 hover:text-base-content"
                        title="Cancel reply"
                      >
                        <FaTimes className="text-[9px]" />
                      </button>
                    </div>
                  )}

                  {/* Editing Banner */}
                  {editingMessage && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-warning/15 border-b border-warning/30 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FaPencilAlt className="text-warning text-[10px] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-semibold text-warning">Editing: </span>
                          <span className="text-base-content/70 truncate">{editingMessage.content}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="btn btn-ghost btn-circle btn-xs text-base-content/50 hover:text-base-content"
                        title="Cancel edit"
                      >
                        <FaTimes className="text-[9px]" />
                      </button>
                    </div>
                  )}

                  {/* Floating Mention Autocomplete Menu */}
                  {showMentionMenu && conversationMembers.length > 0 && (
                    <div className="absolute bottom-full left-3 right-3 mb-2 bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-1.5 max-h-44 overflow-y-auto z-20 space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-base-content/40 uppercase tracking-wider flex items-center gap-1.5 border-b border-base-200">
                        <FaAt className="text-primary text-xs" /> Tag a colleague in {getConvTitle(selectedConv)}
                      </div>
                      {conversationMembers
                        .filter((m) =>
                          !mentionQuery ||
                          m.name?.toLowerCase().includes(mentionQuery) ||
                          m.username?.toLowerCase().includes(mentionQuery)
                        )
                        .slice(0, 8)
                        .map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectMention(m)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-base-200/80 transition text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base-content group-hover:text-primary transition">
                                {m.name}
                              </span>
                              <span className="text-[10px] text-primary font-mono opacity-80">
                                @{m.username}
                              </span>
                            </div>
                            <span className="text-[10px] text-base-content/40 capitalize">
                              {m.role ? m.role.replace(/-/g, " ") : "Staff"}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}

                  <div className="px-3 pt-2">
                    <PatientTagSelector
                      selectedPatient={selectedPatient}
                      onSelectPatient={setSelectedPatient}
                    />
                  </div>
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 flex items-end gap-2"
                  >
                    <textarea
                      ref={messageInputRef}
                      rows={1}
                      placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="textarea textarea-bordered textarea-sm flex-1 bg-base-200/80 border-base-300 rounded-xl text-xs focus:bg-base-100 focus:border-primary resize-none py-2 max-h-32 leading-relaxed"
                    />
                    <button
                      type="submit"
                      disabled={(!inputText.trim() && !selectedPatient) || sending}
                      className={`btn btn-sm btn-circle shrink-0 mb-0.5 ${
                        editingMessage ? "btn-warning" : "btn-primary"
                      }`}
                      title={editingMessage ? "Save edit" : "Send message"}
                    >
                      {sending ? (
                        <FaSpinner className="animate-spin text-xs" />
                      ) : editingMessage ? (
                        <FaPencilAlt className="text-xs" />
                      ) : (
                        <FaPaperPlane className="text-xs" />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <StaffDirectoryModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSelectStaff={handleStartDirectChat}
      />
      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={(newConv) => {
          setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
          handleSelectConversation(newConv);
        }}
      />
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        onBroadcastSent={() => loadConversations()}
      />
      <MessageInfoModal
        isOpen={!!selectedInfoMsg}
        onClose={() => setSelectedInfoMsg(null)}
        message={selectedInfoMsg}
      />
    </>
  );
};

export default ChatDrawer;
