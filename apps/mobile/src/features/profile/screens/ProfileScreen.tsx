import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../../core/store/useAuthStore';
import { useTheme } from '../../../core/hooks/useTheme';
import { supabase } from '../../../core/services/supabase';

export default function ProfileScreen() {
  const { profile, userRole, setRole, signOut, refreshProfile } = useAuthStore();
  const { colors, roundness } = useTheme();
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [updating, setUpdating] = useState(false);
  
  const [workerStats, setWorkerStats] = useState<{ trust_score: number; verification_level: string } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (profile && userRole === 'worker') {
      fetchWorkerStats();
    }
  }, [profile, userRole]);

  const fetchWorkerStats = async () => {
    if (!profile) return;
    setStatsLoading(true);
    try {
      const { data, error } = await supabase
        .from('worker_profiles')
        .select('trust_score, verification_level')
        .eq('user_id', profile.id)
        .single();

      if (!error && data) {
        setWorkerStats(data);
      }
    } catch (_e) {
      // Ignore
    } finally {
      setStatsLoading(false);
    }
  };

  const toggleRole = () => {
    const nextRole = userRole === 'worker' ? 'client' : 'worker';
    setRole(nextRole);
    Alert.alert('Role Switched', `Active workspace role changed to: ${nextRole.toUpperCase()}`);
  };

  const handleUpdate = async () => {
    if (!profile) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          bio: bio,
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <Image
          source={{ uri: profile?.avatar_url ?? 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{profile?.email}</Text>
        
        <View style={styles.roleContainer}>
          <Text style={[styles.roleLabel, { color: colors.textMuted }]}>Active Workspace: </Text>
          <Text style={[styles.roleText, { color: colors.primary }]}>{userRole.toUpperCase()}</Text>
        </View>

        {userRole === 'worker' && workerStats && (
          <View style={[styles.trustBadge, { backgroundColor: colors.border, borderRadius: roundness.sm }]}>
            <Text style={[styles.trustText, { color: colors.text }]}>
              Trust Score: {workerStats.trust_score}/100 ({workerStats.verification_level.toUpperCase()})
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.switchButton, { backgroundColor: colors.primary, borderRadius: roundness.md }]}
          onPress={toggleRole}
        >
          <Text style={styles.switchButtonText}>
            Switch to {userRole === 'worker' ? 'Client' : 'Worker'} View
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: roundness.md }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bio / Skills Info</Text>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleUpdate} disabled={updating}>
              {updating ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={{ color: colors.success, fontWeight: '700' }}>Save</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: roundness.sm }]}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, styles.bioInput, { borderColor: colors.border, color: colors.text, borderRadius: roundness.sm }]}
              placeholder="Bio description"
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>
        ) : (
          <Text style={[styles.bioText, { color: colors.textMuted }]}>
            {profile?.bio || 'No bio details provided yet. Click edit to add profile details.'}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.danger, borderRadius: roundness.md }]} 
          onPress={signOut}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  roleLabel: {
    fontSize: 14,
  },
  roleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  trustBadge: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trustText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  switchButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  editForm: {
    width: '100%',
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  footer: {
    marginVertical: 40,
    paddingHorizontal: 16,
  },
  logoutButton: {
    height: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
