import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../../core/store/useAuthStore';
import { useChatStore } from '../../../core/store/useChatStore';
import { useTheme } from '../../../core/hooks/useTheme';

// Memoized message bubble component to optimize scrolling list updates
const MessageBubble = React.memo(({ item, isMine, colors, roundness }: { item: any; isMine: boolean; colors: any; roundness: any }) => {
  return (
    <View
      style={[
        styles.messageBubble,
        isMine ? styles.bubbleRight : styles.bubbleLeft,
        {
          backgroundColor: isMine ? colors.primary : colors.card,
          borderRadius: roundness.md,
          borderColor: colors.border,
          borderWidth: isMine ? 0 : 1,
        },
      ]}
    >
      <Text style={[styles.messageText, { color: isMine ? '#FFF' : colors.text }]}>
        {item.message_text}
      </Text>
    </View>
  );
});

export default function ChatScreen() {
  const { profile } = useAuthStore();
  const { messages, loading, fetchMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { colors, roundness } = useTheme();

  const [text, setText] = useState('');
  
  const conversationId = '4f8d22df-25c7-4581-9988-9d8e64c39ebc';
  const receiverId = '90fcf640-1b2c-4731-8973-199f7d2bc50e';

  useEffect(() => {
    if (profile) {
      fetchMessages(conversationId);
      subscribeToMessages(conversationId, (_msg) => {});
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [profile]);

  const handleSend = () => {
    if (!text.trim() || !profile) return;
    sendMessage(conversationId, profile.id, receiverId, text.trim());
    setText('');
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isMine = item.sender_id === profile?.id;
    return (
      <MessageBubble 
        item={item} 
        isMine={isMine} 
        colors={colors} 
        roundness={roundness} 
      />
    );
  }, [profile?.id, colors, roundness]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.chatName, { color: colors.text }]}>Direct Chat Session</Text>
          <Text style={[styles.chatStatus, { color: colors.success }]}>Online Channel</Text>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            renderItem={renderItem}
            initialNumToRender={12}
            maxToRenderPerBatch={15}
            windowSize={5}
            removeClippedSubviews={true}
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: roundness.full }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: colors.primary, borderRadius: roundness.full }]} 
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    maxWidth: '80%',
    marginBottom: 12,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 15,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginRight: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 60,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
