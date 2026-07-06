import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../../core/store/useAuthStore';
import { useGigStore } from '../../../core/store/useGigStore';
import { useTheme } from '../../../core/hooks/useTheme';

// Memoized Card component to prevent wasteful item re-renders
const GigCard = React.memo(({ item, colors, roundness, onBidPress }: { item: any; colors: any; roundness: any; onBidPress: (item: any) => void }) => {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: roundness.md }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.cardPrice, { color: colors.success }]}>₹{item.budget_amount}</Text>
      </View>
      <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.tag, { backgroundColor: colors.border, color: colors.text, borderRadius: roundness.sm }]}>
          {item.category}
        </Text>
        <TouchableOpacity 
          style={[styles.bidButton, { backgroundColor: colors.primary, borderRadius: roundness.sm }]}
          onPress={() => onBidPress(item)}
        >
          <Text style={styles.bidButtonText}>Place Bid</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function GigDiscoveryScreen() {
  const { userRole, profile } = useAuthStore();
  const { gigs, loading, fetchAvailableGigs, createGig } = useGigStore();
  const { colors, roundness } = useTheme();

  // Posting form state (For Client role)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [category, setCategory] = useState('Home Services');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (userRole === 'worker') {
      fetchAvailableGigs();
    }
  }, [userRole]);

  const handlePostGig = async () => {
    if (!profile) return;
    if (!title || !description || !budgetAmount) {
      Alert.alert('Error', 'Please fill in all gig details');
      return;
    }

    setPosting(true);
    const success = await createGig({
      title,
      description,
      budget_type: 'fixed',
      budget_amount: parseFloat(budgetAmount),
      category,
      required_skills: [],
      attachments: []
    }, profile.id);

    setPosting(false);
    if (success) {
      Alert.alert('Success', 'Your gig was posted successfully!');
      setTitle('');
      setDescription('');
      setBudgetAmount('');
    } else {
      Alert.alert('Error', 'Failed to post gig. Try again.');
    }
  };

  const handleBidPress = useCallback((item: any) => {
    Alert.alert(
      'Place Bid',
      `Submit bid for ${item.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: () => Alert.alert('Bid Received', 'You placed a bid successfully!') 
        }
      ]
    );
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <GigCard 
      item={item} 
      colors={colors} 
      roundness={roundness} 
      onBidPress={handleBidPress} 
    />
  ), [colors, roundness, handleBidPress]);

  if (userRole === 'client') {
    // Client UI: Post requirements
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Post Gig Requirement</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Post your requirement to find skilled workers nearby
        </Text>

        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: roundness.md }]}
          placeholder="Gig Title (e.g. Leaking Faucet Fix)"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, borderRadius: roundness.md }]}
          placeholder="Describe what needs to be done..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: roundness.md }]}
          placeholder="Budget Amount (INR)"
          placeholderTextColor={colors.textMuted}
          value={budgetAmount}
          onChangeText={setBudgetAmount}
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={[styles.postButton, { backgroundColor: colors.primary, borderRadius: roundness.md }]}
          onPress={handlePostGig}
          disabled={posting}
        >
          {posting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.postButtonText}>Submit Requirement</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Worker UI: Browse nearby matches with optimized FlatList props
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Explore Gigs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Gigs matching your location & skills
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={gigs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No open matching gigs found near your location.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 16,
  },
  input: {
    height: 52,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  postButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  postButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  bidButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bidButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
