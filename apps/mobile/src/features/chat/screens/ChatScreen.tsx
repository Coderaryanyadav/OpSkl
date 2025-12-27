import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../../../core/api/supabase';
import { AuraColors, AuraSpacing } from '../../../core/theme/aura';
import { AuraHeader } from '../../../core/components/AuraHeader';
import { AuraText } from '../../../core/components/AuraText';
import { Send, Image as ImageIcon, Mic, Plus } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { sanitizeInput } from '../../../core/utils/security';
import * as Haptics from 'expo-haptics';

dayjs.extend(relativeTime);

const MessageBubble = React.memo(({ item, isMe }: { item: any; isMe: boolean }) => (
    <View style={[
        styles.bubbleContainer,
        isMe ? styles.myBubbleContainer : styles.theirBubbleContainer
    ]}>
        <View style={[
            styles.messageBubble,
            isMe ? styles.myMessage : styles.theirMessage
        ]}>
            <AuraText color={AuraColors.white} style={styles.messageText}>
                {item.content}
            </AuraText>
            <AuraText variant="caption" color={isMe ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)'} style={styles.time}>
                {dayjs(item.created_at).format('h:mm A')}
            </AuraText>
        </View>
    </View>
));

export default function ChatScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const params = route.params || {};
    const { roomId, recipientName } = params;

    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
        };
        fetchMessages();

        const subscription = supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
                if (payload.new.sender_id !== currentUserId) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, [roomId, currentUserId]);

    const sendMessage = async () => {
        const cleanInput = sanitizeInput(input);
        if (!cleanInput) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newMessage = {
            room_id: roomId,
            sender_id: user.id,
            content: cleanInput,
        };

        setInput('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const { error } = await supabase.from('messages').insert(newMessage);
        if (error) {
            console.error("[Chat] Send Error:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const renderMessage = useCallback(({ item }: { item: any }) => {
        const isMe = item.sender_id === currentUserId;
        return <MessageBubble item={item} isMe={isMe} />;
    }, [currentUserId]);

    return (
        <View style={styles.container}>
            <AuraHeader title={recipientName || 'Terminal'} showBack />

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id?.toString() || item.created_at?.toString()}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.inputArea}>
                    <View style={styles.inputBar}>
                        <TouchableOpacity style={styles.addBtn}>
                            <Plus color={AuraColors.primary} size={24} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Message..."
                            placeholderTextColor={AuraColors.gray500}
                            multiline
                        />
                        {input.trim() ? (
                            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                                <Send color={AuraColors.primary} size={22} fill={AuraColors.primary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.inputIcons}>
                                <TouchableOpacity style={styles.iconBtn}><ImageIcon color={AuraColors.gray500} size={22} /></TouchableOpacity>
                                <TouchableOpacity style={styles.iconBtn}><Mic color={AuraColors.gray500} size={22} /></TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    listContent: {
        paddingVertical: AuraSpacing.l,
        paddingHorizontal: AuraSpacing.m,
    },
    bubbleContainer: {
        width: '100%',
        marginVertical: 2,
    },
    myBubbleContainer: {
        alignItems: 'flex-end',
    },
    theirBubbleContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myMessage: {
        backgroundColor: AuraColors.primary,
    },
    theirMessage: {
        backgroundColor: AuraColors.surfaceElevated,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    time: {
        marginTop: 4,
        alignSelf: 'flex-end',
        fontSize: 10,
    },
    inputArea: {
        paddingHorizontal: AuraSpacing.m,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        backgroundColor: AuraColors.background,
    },
    inputBar: {
        flexDirection: 'row',
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: 24,
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    addBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        minHeight: 36,
        maxHeight: 120,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: AuraColors.white,
        fontSize: 16,
    },
    inputIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    }
});
