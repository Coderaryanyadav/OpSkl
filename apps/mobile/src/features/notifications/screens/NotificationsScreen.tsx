import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../../core/services/supabase';
import { useTheme } from '../../../core/hooks/useTheme';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: 'system' | 'match' | 'chat' | 'payment' | 'dispute';
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const { colors, roundness } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (e: any) {
      Alert.alert('Error loading notifications', e.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subscription = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleMarkAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      Alert.alert('Success', 'All notifications marked as read.');
    } catch (e: any) {
      Alert.alert('Operation Failed', e.message);
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'dispute':
        return colors.danger;
      case 'payment':
        return colors.success;
      case 'match':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Realtime activity feed and system updates
          </Text>
        </View>

        {notifications.some((n) => !n.is_read) && (
          <TouchableOpacity
            style={[styles.readBtn, { borderColor: colors.border, borderRadius: roundness.sm }]}
            onPress={handleMarkAllRead}
          >
            <Text style={[styles.readBtnText, { color: colors.primary }]}>Mark Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[
            styles.notifyCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: roundness.md,
              opacity: item.is_read ? 0.75 : 1
            }
          ]}>
            <View style={styles.notifyHeader}>
              <View style={styles.badgeRow}>
                <View style={[styles.indicator, { backgroundColor: getIconColor(item.notification_type) }]} />
                <Text style={[styles.notifyTitle, { color: colors.text }]}>{item.title}</Text>
              </View>
              {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </View>

            <Text style={[styles.notifyBody, { color: colors.textMuted }]}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            You do not have any notifications at the moment.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  readBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  readBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notifyCard: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  notifyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  notifyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notifyBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
