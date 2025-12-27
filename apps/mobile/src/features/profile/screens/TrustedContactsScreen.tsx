import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { AuraHeader } from '../../../core/components/AuraHeader';
import { supabase } from '../../../core/api/supabase';
import { AuraText } from '../../../core/components/AuraText';
import { AuraButton } from '../../../core/components/AuraButton';
import { AuraInput } from '../../../core/components/AuraInput';
import { AuraMotion } from '../../../core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraShadows } from '../../../core/theme/aura';
import { Shield, Trash2, Plus, User, Phone, Signal, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

export default function TrustedContactsScreen() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchContacts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('trusted_contacts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContacts(data || []);
        } catch (e: any) {
            console.error("Fetch contacts error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const addContact = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert("Registry Error", "Identity designation and uplink signal required.");
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.from('trusted_contacts').insert({
                user_id: user.id,
                name: name.trim(),
                phone: phone.trim()
            }).select().single();

            if (error) throw error;

            setContacts(prev => [data, ...prev]);
            setName('');
            setPhone('');
            setAdding(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e: any) {
            Alert.alert("Link Failure", e.message);
        }
    };

    const removeContact = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { error } = await supabase.from('trusted_contacts').delete().eq('id', id);
            if (error) throw error;
            setContacts(prev => prev.filter(c => c.id !== id));
        } catch (e: any) {
            Alert.alert("Protocol Breach", "Failed to terminate secure link.");
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <AuraMotion type="slide" delay={index * 100} duration={600}>
            <View style={styles.item}>
                <View style={styles.contactInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <User size={20} color={AuraColors.gray600} />
                    </View>
                    <View style={{ marginLeft: 20 }}>
                        <AuraText variant="h3">{item.name}</AuraText>
                        <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 4 }}>UPLINK: {item.phone}</AuraText>
                    </View>
                </View>
                <TouchableOpacity onPress={() => removeContact(item.id)} style={styles.deleteBtn}>
                    <Trash2 color={AuraColors.error} size={20} />
                </TouchableOpacity>
            </View>
        </AuraMotion>
    );

    return (
        <View style={styles.container}>
            <AuraHeader title="Emergency Protocols" showBack />

            <AuraMotion type="slide" style={styles.heroSection}>
                <View style={styles.heroCard}>
                    <View style={styles.iconBox}>
                        <Signal color={AuraColors.white} size={28} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 20 }}>
                        <AuraText variant="h3">SOS Target Uplinks</AuraText>
                        <AuraText variant="caption" color={AuraColors.gray600} style={{ marginTop: 4, lineHeight: 16 }}>
                            These nodes will receive your last known coordinates and mission status during an emergency signal.
                        </AuraText>
                    </View>
                </View>
            </AuraMotion>

            <FlatList
                data={contacts}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Shield size={40} color={AuraColors.gray700} />
                        </View>
                        <AuraText variant="h3" style={{ marginTop: 32 }}>Insecure Deployment</AuraText>
                        <AuraText variant="body" color={AuraColors.gray600} align="center" style={{ marginTop: 12, paddingHorizontal: 48 }}>
                            No emergency fail-safe nodes registered. We recommend establishing at least two trusted signal targets.
                        </AuraText>
                    </View>
                }
            />

            {adding && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)' }]}
                    >
                        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setAdding(false)} />
                    </Animated.View>

                    <Animated.View
                        entering={SlideInDown}
                        exiting={SlideOutDown}
                        style={styles.formSheet}
                    >
                        <View style={styles.sheetHeader}>
                            <AuraText variant="h2">Register Node</AuraText>
                            <TouchableOpacity onPress={() => setAdding(false)} style={styles.closeBtn}>
                                <X size={24} color={AuraColors.gray600} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <AuraInput
                                label="Designation (Name)"
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Primary Guard"
                                leftIcon={<User size={18} color={AuraColors.white} />}
                            />
                            <AuraInput
                                label="Uplink Number (Phone)"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+91 0000 0000"
                                keyboardType="phone-pad"
                                leftIcon={<Phone size={18} color={AuraColors.white} />}
                            />
                        </View>

                        <AuraButton
                            title="ESTABLISH SECURE LINK"
                            onPress={addContact}
                            style={styles.submitBtn}
                        />
                    </Animated.View>
                </View>
            )}

            {!adding && (
                <AuraMotion type="zoom" style={styles.fabContainer}>
                    <TouchableOpacity style={styles.fab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAdding(true); }}>
                        <Plus color={AuraColors.black} size={32} />
                    </TouchableOpacity>
                </AuraMotion>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    heroSection: {
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 24,
    },
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: AuraColors.black,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AuraColors.gray700,
    },
    list: {
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 120,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: AuraColors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AuraColors.gray100,
    },
    deleteBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 69, 58, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 58, 0.1)',
    },
    formSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: AuraColors.background,
        padding: 40,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.floating,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: AuraColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AuraColors.gray200,
    },
    form: {
        gap: 28,
    },
    submitBtn: {
        marginTop: 56,
        height: 64,
        borderRadius: 32,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 40,
        right: 24,
    },
    fab: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: AuraColors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...AuraShadows.floating,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 120,
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
