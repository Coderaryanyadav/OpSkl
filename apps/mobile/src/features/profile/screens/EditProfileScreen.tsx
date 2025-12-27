import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@api/supabase';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraInput } from '@core/components/AuraInput';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraShadows } from '@theme/aura';
import { AuraLoader } from '@core/components/AuraLoader';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User, Briefcase, Globe, IndianRupee } from 'lucide-react-native';
import { validateUrl, validateAmount } from '@core/utils/validation';
import { sanitizeInput } from '@core/utils/security';

export default function EditProfileScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();
    const { showDialog, showToast } = useAura();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [website, setWebsite] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);

    const initData = useCallback(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setTitle(profile.headline || '');
            setBio(profile.bio || '');
            setWebsite(profile.website || '');
            setHourlyRate(profile.hourly_rate?.toString() || '');
            setAvatar(profile.avatar_url);
        }
        setFetching(false);
    }, [profile]);

    useEffect(() => {
        initData();
    }, [initData]);

    const pickImage = async () => {
        haptics.light();
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                showDialog({
                    title: "Payload Too Large",
                    message: "Please select an image under 5MB for optimal synchronization.",
                    primaryLabel: "Understood",
                    onConfirm: () => { }
                });
                return;
            }
            setAvatar(asset.uri);
        }
    };

    const handleSave = async () => {
        if (website && !validateUrl(website)) {
            showToast({ message: "Signal Link Error: Invalid URL", type: 'error' });
            return;
        }

        if (hourlyRate && !validateAmount(hourlyRate)) {
            showToast({ message: "Valuation Error: Invalid Rate", type: 'error' });
            return;
        }

        setLoading(true);
        haptics.medium();

        try {
            if (!user) throw new Error("No active session detected.");

            const updateData = {
                full_name: sanitizeInput(fullName),
                headline: sanitizeInput(title),
                bio: sanitizeInput(bio),
                website: website ? website.trim() : null,
                hourly_rate: hourlyRate ? parseFloat(hourlyRate) : 0,
            };

            const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id);
            if (error) throw error;

            haptics.success();
            showToast({ message: "Identity Synchronized", type: 'success' });
            navigation.goBack();
        } catch (e: any) {
            haptics.error();
            showDialog({
                title: "Sync Failure",
                message: e.message || "Failed to commit changes to the node.",
                primaryLabel: "Retry",
                onConfirm: () => { }
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={styles.center}>
                <AuraLoader size={48} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AuraHeader title="Sync Identity" showBack />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <AuraMotion type="zoom" style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} activeOpacity={0.8}>
                        <View style={styles.avatarBox}>
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={styles.avatar} />
                            ) : (
                                <Camera color={AuraColors.gray600} size={32} />
                            )}
                        </View>
                        <View style={styles.cameraBadge}>
                            <Camera color={AuraColors.black} size={16} />
                        </View>
                    </TouchableOpacity>
                    <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 16, letterSpacing: 1 }}>TAP TO UPDATE NODE ICON</AuraText>
                </AuraMotion>

                <AuraMotion type="slide" delay={200} style={styles.form}>
                    <AuraInput
                        label="Operative Name"
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Legal designation..."
                        leftIcon={<User size={18} color={AuraColors.white} />}
                    />
                    <AuraInput
                        label="Specialization Headline"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Lead Developer..."
                        leftIcon={<Briefcase size={18} color={AuraColors.white} />}
                    />
                    <AuraInput
                        label="Signal Manifesto (Bio)"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Detail your professional utility..."
                        multiline
                        style={{ height: 120 }}
                    />
                    <AuraInput
                        label="Portfolio Uplink"
                        value={website}
                        onChangeText={setWebsite}
                        placeholder="https://terminal.io/you"
                        leftIcon={<Globe size={18} color={AuraColors.white} />}
                    />
                    <AuraInput
                        label="Treasury Rate (₹/hr)"
                        value={hourlyRate}
                        onChangeText={setHourlyRate}
                        keyboardType="numeric"
                        placeholder="800"
                        leftIcon={<IndianRupee size={18} color={AuraColors.white} />}
                    />
                </AuraMotion>

                <AuraMotion type="slide" delay={400}>
                    <AuraButton
                        title={loading ? "SYNCHRONIZING..." : "COMMIT CHANGES"}
                        onPress={handleSave}
                        disabled={loading}
                        style={styles.saveBtn}
                    />
                </AuraMotion>
            </ScrollView>
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
    content: {
        padding: AuraSpacing.xl,
        paddingBottom: 80,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarBox: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: AuraColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: AuraColors.gray200,
        overflow: 'hidden',
        ...AuraShadows.soft,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: AuraColors.white,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: AuraColors.background,
        ...AuraShadows.soft,
    },
    form: {
        gap: 28,
    },
    saveBtn: {
        marginTop: 56,
        height: 64,
        borderRadius: 32,
    }
});
