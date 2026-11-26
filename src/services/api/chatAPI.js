import apiClient from "./apiClient";

export const chatAPI = {
  getConversations: async () => {
    const res = await apiClient.get("/chat/conversations");
    return res.data;
  },

  getOrCreateDirectConversation: async (recipientId) => {
    const res = await apiClient.post("/chat/conversations/direct", { recipientId });
    return res.data;
  },

  getUnreadSummary: async () => {
    const res = await apiClient.get("/chat/conversations/unread-summary");
    return res.data;
  },

  getMessages: async (conversationId, cursor = null, limit = 30) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    const res = await apiClient.get(`/chat/conversations/${conversationId}/messages`, { params });
    return res.data;
  },

  getConversationMembers: async (conversationId) => {
    const res = await apiClient.get(`/chat/conversations/${conversationId}/members`);
    return res.data;
  },

  markAsRead: async (conversationId) => {
    const res = await apiClient.post(`/chat/conversations/${conversationId}/read`);
    return res.data;
  },

  sendMessage: async (payload) => {
    const res = await apiClient.post("/chat/messages", payload);
    return res.data;
  },

  getStaffDirectory: async (query = "") => {
    const res = await apiClient.get("/chat/staff", { params: { q: query } });
    return res.data;
  },

  createGroup: async ({ name, memberIds }) => {
    const res = await apiClient.post("/chat/groups", { name, memberIds });
    return res.data;
  },

  addGroupMembers: async (conversationId, { memberIds }) => {
    const res = await apiClient.post(`/chat/groups/${conversationId}/members`, { memberIds });
    return res.data;
  },

  editMessage: async (messageId, content) => {
    const res = await apiClient.put(`/chat/messages/${messageId}`, { content });
    return res.data;
  },

  deleteMessage: async (messageId) => {
    const res = await apiClient.delete(`/chat/messages/${messageId}`);
    return res.data;
  },

  toggleReaction: async (messageId, emoji) => {
    const res = await apiClient.post(`/chat/messages/${messageId}/react`, { emoji });
    return res.data;
  },

  getMessageInfo: async (messageId) => {
    const res = await apiClient.get(`/chat/messages/${messageId}/info`);
    return res.data;
  },

  searchMessages: async (conversationId, query) => {
    const res = await apiClient.get(`/chat/conversations/${conversationId}/messages/search`, {
      params: { q: query },
    });
    return res.data;
  },
};

export default chatAPI;
