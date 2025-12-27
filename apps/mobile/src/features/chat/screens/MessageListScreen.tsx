import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@api/supabase';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraAvatar } from '@core/components/AuraAvatar';
import { SkeletonLoader } from '@core/components/SkeletonLoader';
import { AuraColors, AuraSpacing, AuraBorderRadius } from '@theme/aura';
import { AuraMotion } from '@core/components/AuraMotion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { MessageSquare, Search, ShieldCheck } from 'lucide-react-native';
import { AuraInput } from '@core/components/AuraInput';
import { useAuth } from '@context/AuthProvider';

dayjs.extend(relativeTime);

const ChatListItem = React.memo(({ item, index, onPress }: { item: any; index: number; onPress: (item: any) => void }) => {
    const haptics = useAuraHaptics();
    const lastMsg = item.messages?.[0];
    const otherParticipant = item.participants?.[0]?.profiles;

    return (
        <AuraMotion type="slide" delay={index * 50}>
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => {
                    haptics.selection();
                    onPress(item);
                }}
                activeOpacity={0.7}
            >
                <AuraAvatar
                    source={otherParticipant?.avatar_url}
                    size={60}
                    isOnline={otherParticipant?.is_online}
                />
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <AuraText variant="h3" numberOfLines={1} style={{ flex: 1, fontSize: 18 }}>
                            {otherParticipant?.full_name || "Unknown Operative"}
                        </AuraText>
                        <AuraText variant="caption" color={AuraColors.gray400}>
                            {lastMsg ? dayjs(lastMsg.created_at).fromNow(true) : ''}
                        </AuraText>
                    </View>
                    <View style={styles.lastMsgRow}>
                        <AuraText
                            variant="body"
                            color={AuraColors.gray300}
                            numberOfLines={1}
                            style={styles.lastMsgText}
                        >
                            {lastMsg?.content || "Channel secured. No messages yet."}
                        </AuraText>
                        {!lastMsg && <ShieldCheck size={14} color={AuraColors.primary} />}
                    </View>
                </View>
            </TouchableOpacity>
        </AuraMotion>
    );
});

export default function MessageListScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchRooms = useCallback(async () => {
        if (!user) return;
        try {
            const { data: participationData } = await supabase
                .from('chat_participants')
                .select('room_id')
                .eq('user_id', user.id);

            const roomIds = participationData?.map(p => p.room_id) || [];

            if (roomIds.length === 0) {
                setRooms([]);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('chat_rooms')
                .select(`
                    id,
                    metadata,
                    created_at,
                    participants:chat_participants(
                        profiles:profiles(id, full_name, avatar_url, is_online)
                    ),
                    messages(content, created_at, sender_id)
                `)
                .in('id', roomIds)
                .order('created_at', { foreignTable: 'messages', ascending: false })
                .limit(1, { foreignTable: 'messages' });

            if (data) {
                const processed = data.map(room => ({
                    ...room,
                    participants: room.participants.filter((p: any) => (p.profiles?.id || p.profiles?.[0]?.id) !== user.id)
                })).sort((a, b) => {
                    const timeA = a.messages?.[0]?.created_at || a.created_at;
                    const timeB = b.messages?.[0]?.created_at || b.created_at;
                    return dayjs(timeB).unix() - dayjs(timeA).unix();
                });
                setRooms(processed);
            }
        } catch (e) {
            console.error('[MessageList] Fetch Error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRooms();

        const subscription = supabase
            .channel('message-list-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                fetchRooms();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, [fetchRooms]);

    const handlePress = (room: any) => {
        const otherParticipant = room.participants?.[0]?.profiles;
        navigation.navigate('Chat', {
            roomId: room.id,
            recipientName: otherParticipant?.full_name || "Operative"
        });
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRooms();
    };

    const filteredRooms = rooms.filter(room => {
        const otherParticipant = room.participants?.[0]?.profiles;
        return otherParticipant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (loading && rooms.length === 0) {
        return (
            <View style={styles.container}>
                <AuraHeader title="Secure Comms" showBack={false} />
                <View style={styles.list}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <View key={i} style={styles.skeletonItem}>
                            <SkeletonLoader width={60} height={60} borderRadius={30} />
                            <View style={{ gap: 8, flex: 1, marginLeft: 16 }}>
                                <SkeletonLoader width="60%" height={20} />
                                <SkeletonLoader width="90%" height={16} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
        <ChatListItem item={item} index={index} onPress={handlePress} />
    ), [handlePress]);

    const keyExtractor = useCallback((item: any) => item.id, []);

    return (
        <View style={styles.container}>
            <AuraHeader title="Secure Comms" showBack={false} />

            <View style={styles.searchBox}>
                <AuraInput
                    placeholder="Search secure channels..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon={<Search size={18} color={AuraColors.gray500} />}
                    containerStyle={{ marginBottom: 0 }}
                />
            </View>

            <FlashList
                data={filteredRooms}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.list}
                estimatedItemSize={88}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AuraColors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <MessageSquare size={40} color={AuraColors.primary} />
                        </View>
                        <AuraText variant="h2" align="center" style={{ marginBottom: 8 }}>Silent Network</AuraText>
                        <AuraText variant="body" color={AuraColors.gray400} align="center">
                            No active communication lines established yet.
                        </AuraText>
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    searchBox: {
        paddingHorizontal: AuraSpacing.xl,
        paddingTop: 12,
        paddingBottom: 8,
    },
    list: {
        padding: AuraSpacing.xl,
        paddingBottom: 120,
    },
    chatItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xl,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    chatContent: {
        flex: 1,
        marginLeft: 16,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    lastMsgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMsgText: {
        flex: 1,
        marginRight: 8,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 48,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 122, 255, 0.2)',
    },
    skeletonItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xl,
        marginBottom: 12,
        alignItems: 'center',
    }
});
