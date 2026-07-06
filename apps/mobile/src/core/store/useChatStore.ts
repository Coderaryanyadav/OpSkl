import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'location' | 'system';
  created_at: string;
}

interface ChatState {
  messages: Message[];
  loading: boolean;
  activeChannel: any | null;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, receiverId: string, text: string) => Promise<void>;
  subscribeToMessages: (conversationId: string, onMessageReceived: (message: Message) => void) => void;
  unsubscribeFromMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  activeChannel: null,

  fetchMessages: async (conversationId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [], loading: false });
    } catch (_e) {
      set({ loading: false });
    }
  },

  sendMessage: async (conversationId, senderId, receiverId, text) => {
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        message_text: text,
        message_type: 'text',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },

  subscribeToMessages: (conversationId, onMessageReceived) => {
    // Unsubscribe from any active channel first
    get().unsubscribeFromMessages();

    const channel = supabase
      .channel(`room:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          set((state) => ({ messages: [...state.messages, newMessage] }));
          onMessageReceived(newMessage);
        }
      )
      .subscribe();

    set({ activeChannel: channel });
  },

  unsubscribeFromMessages: () => {
    const { activeChannel } = get();
    if (activeChannel) {
      supabase.removeChannel(activeChannel);
      set({ activeChannel: null });
    }
  },
}));
