import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '@api/supabase';
import { AuraColors, AuraSpacing } from '@theme/aura';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { Send, ImageIcon, Mic, Plus, MoreVertical, Check, CheckCheck, Video, Phone } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { sanitizeInput } from '@core/utils/security';
import { useAuth } from '@context/AuthProvider';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { useAura } from '@core/context/AuraProvider';

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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                <AuraText variant="caption" color={isMe ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)'} style={{ fontSize: 10 }}>
                    {dayjs(item.created_at).format('h:mm A')}
                </AuraText>
                {isMe && (
                    item.read_at ?
                        <CheckCheck size={12} color={AuraColors.info} /> :
                        <Check size={12} color={AuraColors.gray400} />
                )}
            </View>
        </View>
    </View>
));

export default function ChatScreen() {
    const haptics = useAuraHaptics();
    const { showToast } = useAura();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const params = route.params || {};
    const { roomId, recipientName } = params;

    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isRecipientTyping, setIsRecipientTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!user) return;

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
                if (payload.new.sender_id !== user.id) {
                    haptics.success();
                    // Mark new incoming message as read instantly if we are on screen
                    supabase.from('messages').update({ read_at: new Date() }).eq('id', payload.new.id);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                setMessages(current => current.map(m => m.id === payload.new.id ? payload.new : m));
            })
            .subscribe();

        // Mark all existing unread messages as read
        const markRead = async () => {
            await supabase.from('messages')
                .update({ read_at: new Date() })
                .eq('room_id', roomId)
                .neq('sender_id', user.id)
                .is('read_at', null);
        };
        markRead();

        const presenceChannel = supabase.channel(`typing:${roomId}`);

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const typingUsers = Object.values(state).flat().filter((u: any) => u.user_id !== user.id && u.isTyping);
                setIsRecipientTyping(typingUsers.length > 0);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ user_id: user.id, isTyping: false });
                }
            });

        return () => {
            supabase.removeChannel(subscription);
            supabase.removeChannel(presenceChannel);
        };
    }, [roomId, user, haptics]);

    const handleType = (text: string) => {
        setInput(text);
        const channel = supabase.channel(`typing:${roomId}`);
        channel.track({ user_id: user?.id, isTyping: text.length > 0 });
    };

    const sendMessage = async () => {
        const cleanInput = sanitizeInput(input);
        if (!cleanInput || !user) return;

        // Tactical watchdog: Detect external contact/payment phishing (Layer 3)
        const blocklist = [/(\d{10,})/, /paytm/i, /gpay/i, /phonepe/i, /@gmail\.com/i, /@yahoo\.com/i, /whatsapp/i];
        const isSuspicious = blocklist.some(regex => regex.test(cleanInput));

        if (isSuspicious) {
            haptics.error();
            showToast({ message: "SIGNAL BLOCKED: Security policy prohibits sharing external contact/payment intel within this frequency.", type: 'error' });
            return;
        }

        const newMessage = {
            room_id: roomId,
            sender_id: user.id,
            content: cleanInput,
        };

        setInput('');
        haptics.light();

        const { error } = await supabase.from('messages').insert(newMessage);
        if (error) {
            console.error("[Chat] Send Error:", error);
            haptics.error();
        }
    };

    const renderMessage = useCallback(({ item }: { item: any }) => {
        const isMe = item.sender_id === user?.id;
        return <MessageBubble item={item} isMe={isMe} />;
    }, [user?.id]);

    return (
        <View style={styles.container}>
            <AuraHeader
                title={recipientName || 'Terminal'}
                showBack
                rightElement={
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => haptics.selection()}><Phone size={20} color={AuraColors.primary} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => haptics.selection()}><Video size={20} color={AuraColors.primary} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            Alert.alert(
                                "Manage Connection",
                                "What would you like to do?",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Report Abuse", onPress: () => Alert.alert("Reported", "Safety team notified."), style: 'destructive' },
                                    { text: "Block User", onPress: () => Alert.alert("Blocked", "You will no longer receive messages."), style: 'destructive' }
                                ]
                            );
                        }}>
                            <MoreVertical color={AuraColors.gray500} size={24} />
                        </TouchableOpacity>
                    </View>
                }
            />

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id?.toString() || item.created_at?.toString()}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={isRecipientTyping ? (
                    <View style={styles.typingIndicator}>
                        <AuraText variant="caption" color={AuraColors.primary}>Operative is transmitting signal...</AuraText>
                    </View>
                ) : null}
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
                            onChangeText={handleType}
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
    },
    typingIndicator: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    }
});
