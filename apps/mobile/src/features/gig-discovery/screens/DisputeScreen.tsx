import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../../core/services/supabase';
import { useTheme } from '../../../core/hooks/useTheme';

export default function DisputeScreen({ route, navigation }: any) {
  // In production, parameters are passed during navigation
  const gigId = route?.params?.gigId ?? '4f8d22df-25c7-4581-9988-9d8e64c39ebc';
  
  const { colors, roundness } = useTheme();
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitDispute = async () => {
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid reason for filing this dispute.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to file a dispute.');

      // Insert dispute log. Triggers hold_disputed_wallet_funds on DB
      const { error } = await supabase
        .from('disputes')
        .insert({
          gig_id: gigId,
          disputed_by: user.id,
          reason: reason,
          evidence_attachments: evidenceUrl ? [evidenceUrl] : [],
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert(
        'Dispute Filed',
        'Your dispute has been recorded. Escrow wallet funds for this gig are now locked until a moderator arbitrates.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Submission Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>File a Dispute</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Contest work parameters or request escrow resolution adjustments
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Reason for Dispute</Text>
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: colors.card, 
            borderColor: colors.border, 
            color: colors.text,
            borderRadius: roundness.md 
          }]}
          multiline
          numberOfLines={6}
          placeholder="Explain in detail why you are contesting this gig execution..."
          placeholderTextColor={colors.textMuted}
          value={reason}
          onChangeText={setReason}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Evidence Link (Optional)</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            borderColor: colors.border, 
            color: colors.text,
            borderRadius: roundness.md 
          }]}
          placeholder="https://example.com/evidence-photo.jpg"
          placeholderTextColor={colors.textMuted}
          value={evidenceUrl}
          onChangeText={setEvidenceUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.danger, borderRadius: roundness.md }]}
          onPress={handleSubmitDispute}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Dispute & Lock Escrow</Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
