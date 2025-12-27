import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../../../core/api/supabase';
import { AuraHeader } from '../../../core/components/AuraHeader';
import { AuraText } from '../../../core/components/AuraText';
import { AuraLoader } from '../../../core/components/AuraLoader';
import { AuraColors, AuraSpacing, AuraShadows } from '../../../core/theme/aura';
import { AuraMotion } from '../../../core/components/AuraMotion';
import { Bell, Briefcase, Star, DollarSign, ShieldAlert } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as Haptics from 'expo-haptics';

dayjs.extend(relativeTime);

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setNotifications(data);
        } catch (e) {
            console.error('Fetch Notifications Error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        const sub = supabase
            .channel('signal-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => { sub.unsubscribe(); };
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await supabase.from('notifications').update({ read: true }).eq('id', id);
    };

    const onRefresh = () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fetchNotifications();
    };

    const getIcon = (type: string, isRead: boolean) => {
        const color = isRead ? AuraColors.gray600 : AuraColors.white;
        switch (type) {
            case 'assignment': return <Briefcase color={color} size={20} />;
            case 'payment': return <DollarSign color={color} size={20} />;
            case 'review': return <Star color={color} size={20} />;
            case 'security': return <ShieldAlert color={AuraColors.error} size={20} />;
            default: return <Bell color={color} size={20} />;
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <AuraMotion type="slide" delay={100 + index * 50} duration={500}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => markAsRead(item.id)}
                style={[styles.item, !item.read && styles.unreadItem]}
            >
                <View style={[styles.iconBox, !item.read && styles.unreadIconBox]}>
                    {getIcon(item.type, item.read)}
                </View>
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <AuraText variant="h3" color={item.read ? AuraColors.gray600 : AuraColors.white}>
                            {item.title}
                        </AuraText>
                        <AuraText variant="label" color={AuraColors.gray600} style={{ letterSpacing: 0.5 }}>
                            {dayjs(item.created_at).fromNow(true).toUpperCase()}
                        </AuraText>
                    </View>
                    <AuraText variant="body" color={item.read ? AuraColors.gray700 : AuraColors.gray500} style={{ marginTop: 6 }}>
                        {item.message}
                    </AuraText>
                </View>
                {!item.read && <View style={styles.signalDot} />}
            </TouchableOpacity>
        </AuraMotion>
    );

    if (loading && notifications.length === 0) return (
        <View style={styles.center}>
            <AuraLoader size={48} />
            <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 24, letterSpacing: 2 }}>DECRYPTING SIGNALS...</AuraText>
        </View>
    );

    return (
        <View style={styles.container}>
            <AuraHeader title="Signal Logs" showBack />

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AuraColors.white} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Bell size={32} color={AuraColors.gray700} />
                        </View>
                        <AuraText variant="h3" style={{ marginTop: 24 }}>Silence Established</AuraText>
                        <AuraText variant="body" color={AuraColors.gray600} align="center" style={{ marginTop: 8, paddingHorizontal: 48 }}>
                            No high-priority signal logs detected in this node.
                        </AuraText>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AuraColors.background,
    },
    list: {
        paddingHorizontal: AuraSpacing.xl,
        paddingTop: 20,
        paddingBottom: 80,
    },
    item: {
        flexDirection: 'row',
        padding: 24,
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    unreadItem: {
        backgroundColor: AuraColors.surfaceLight,
        borderColor: AuraColors.gray100,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: AuraColors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
        borderWidth: 1,
        borderColor: AuraColors.gray200,
    },
    unreadIconBox: {
        backgroundColor: AuraColors.black,
        borderColor: AuraColors.gray700,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    signalDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: AuraColors.white,
        marginLeft: 16,
        ...AuraShadows.soft,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 140,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: AuraColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: AuraColors.gray200,
    }
});
