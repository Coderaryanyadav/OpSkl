import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../../core/services/supabase';
import { useTheme } from '../../../core/hooks/useTheme';

interface Bid {
  id: string;
  gig_id: string;
  worker_id: string;
  proposed_amount: number;
  proposed_duration: number;
  cover_letter: string;
  status: string;
  worker_profiles: {
    user_id: string;
    headline: string;
    average_rating: number;
    profiles: {
      full_name: string;
      avatar_url: string;
    }
  }
}

export default function ApplicationsScreen({ route, navigation }: any) {
  // In a production app, the gig_id is passed as a navigation param
  const gigId = route?.params?.gigId ?? '4f8d22df-25c7-4581-9988-9d8e64c39ebc';
  
  const { colors, roundness } = useTheme();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBids();
  }, [gigId]);

  const fetchBids = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gig_bids')
        .select(`
          id,
          gig_id,
          worker_id,
          proposed_amount,
          proposed_duration,
          cover_letter,
          status,
          worker_profiles (
            user_id,
            headline,
            average_rating,
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('gig_id', gigId);

      if (error) throw error;
      setBids(data as any || []);
    } catch (e: any) {
      Alert.alert('Error loading applications', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bid: Bid) => {
    setActionLoading(true);
    try {
      // 1. Update gig with worker assignment and status change
      const { error: gigError } = await supabase
        .from('gigs')
        .update({
          assigned_worker_id: bid.worker_id,
          status: 'in_progress',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', gigId);

      if (gigError) throw gigError;

      // 2. Update bid status to accepted
      const { error: bidError } = await supabase
        .from('gig_bids')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', bid.id);

      if (bidError) throw bidError;

      // 3. Reject other bids for this gig
      await supabase
        .from('gig_bids')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('gig_id', gigId)
        .neq('id', bid.id);

      Alert.alert('Success', `Successfully hired ${bid.worker_profiles.profiles.full_name}!`);
      fetchBids();
    } catch (e: any) {
      Alert.alert('Hiring Failed', e.message);
    } finally {
      setActionLoading(false);
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
        <Text style={[styles.title, { color: colors.text }]}>Applicants</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Review worker proposals and accept applications
        </Text>
      </View>

      <FlatList
        data={bids}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.bidCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: roundness.md }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.workerName, { color: colors.text }]}>
                  {item.worker_profiles?.profiles?.full_name ?? 'OpSkl Worker'}
                </Text>
                <Text style={[styles.workerHeadline, { color: colors.textMuted }]}>
                  {item.worker_profiles?.headline ?? 'Professional Skills Expert'}
                </Text>
              </View>
              <Text style={[styles.bidAmount, { color: colors.success }]}>₹{item.proposed_amount}</Text>
            </View>

            <Text style={[styles.coverLetter, { color: colors.text }]}>{item.cover_letter}</Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.duration, { color: colors.textMuted }]}>
                Duration: {item.proposed_duration} hours
              </Text>

              {item.status === 'pending' ? (
                <TouchableOpacity
                  style={[styles.acceptBtn, { backgroundColor: colors.primary, borderRadius: roundness.sm }]}
                  onPress={() => handleAcceptBid(item)}
                  disabled={actionLoading}
                >
                  <Text style={styles.acceptBtnText}>Hire Worker</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.statusText, { color: item.status === 'accepted' ? colors.success : colors.danger }]}>
                  {item.status.toUpperCase()}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No applications have been submitted for this gig yet.
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  bidCard: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  workerHeadline: {
    fontSize: 13,
    marginTop: 2,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  coverLetter: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    fontSize: 13,
  },
  acceptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
