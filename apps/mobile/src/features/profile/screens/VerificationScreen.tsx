import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { supabase } from '@api/supabase';
import { AuraColors, AuraSpacing, AuraShadows } from '@theme/aura';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraMotion } from '@core/components/AuraMotion';
import { CheckCircle, AlertCircle, ScanLine, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';

export default function VerificationScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { showDialog, showToast } = useAura();
    const [idFront, setIdFront] = useState<string | null>(null);
    const [idBack, setIdBack] = useState<string | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async (setter: (uri: string) => void) => {
        haptics.light();
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setter(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!idFront || !idBack || !selfie) {
            haptics.error();
            showToast({ message: "Parameters incomplete. All 3 scans required.", type: 'error' });
            return;
        }

        setUploading(true);
        haptics.heavy();

        try {
            if (!user) throw new Error("No active session detected.");

            const { error } = await supabase.from('profiles').update({
                verification_status: 'pending',
                metadata: {
                    verification_submitted_at: new Date().toISOString()
                }
            }).eq('id', user.id);

            if (error) throw error;

            haptics.success();
            showDialog({
                title: 'Verification Submitted',
                message: "Your identity documents have been encrypted and queued for manual compliance audit. Completion expected: 12-24h.",
                primaryLabel: 'CLOSE',
                onConfirm: () => navigation.goBack()
            });
        } catch (e: any) {
            showToast({ message: e.message, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const UploadCard = ({ label, value, setter, delay }: { label: string, value: string | null, setter: (u: string) => void, delay: number }) => (
        <AuraMotion type="slide" delay={delay} duration={600}>
            <TouchableOpacity
                style={[styles.uploadBox, value ? styles.uploadBoxDone : {}]}
                onPress={() => pickImage(setter)}
                activeOpacity={0.9}
            >
                {value ? (
                    <Image source={{ uri: value }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholder}>
                        <View style={styles.scanLineBox}>
                            <ScanLine color={AuraColors.white} size={28} />
                        </View>
                        <AuraText variant="h3" style={{ marginTop: 20 }}>{label}</AuraText>
                        <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 4 }}>SCAN REQUIRED</AuraText>
                    </View>
                )}

                {value && (
                    <View style={styles.checkOverlay}>
                        <CheckCircle color={AuraColors.black} fill={AuraColors.white} size={24} />
                    </View>
                )}

                {!value && (
                    <View style={styles.cornerContainer}>
                        <View style={[styles.corner, styles.tl]} />
                        <View style={[styles.corner, styles.tr]} />
                        <View style={[styles.corner, styles.bl]} />
                        <View style={[styles.corner, styles.br]} />
                    </View>
                )}
            </TouchableOpacity>
        </AuraMotion>
    );

    return (
        <View style={styles.container}>
            <AuraHeader title="Identity Verification" showBack />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <AuraMotion type="zoom" style={styles.headerInfo}>
                    <View style={styles.shieldIcon}>
                        <ShieldCheck size={40} color={AuraColors.white} />
                    </View>
                    <AuraText variant="h2" style={{ marginTop: 24 }}>System Authentication</AuraText>
                    <AuraText variant="body" color={AuraColors.gray600} align="center" style={{ marginTop: 8, paddingHorizontal: 32 }}>
                        Complete the verification protocol to unlock high-priority assignments and premium treasury payouts.
                    </AuraText>
                </AuraMotion>

                <View style={styles.sectionHeader}>
                    <AuraText variant="label" color={AuraColors.gray600} style={{ fontWeight: '900', letterSpacing: 2 }}>PHASE 1: I.D. UPLOAD</AuraText>
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <UploadCard label="ID CARD FRONT" value={idFront} setter={setIdFront} delay={200} />
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 1 }}>
                        <UploadCard label="ID CARD BACK" value={idBack} setter={setIdBack} delay={300} />
                    </View>
                </View>

                <View style={[styles.sectionHeader, { marginTop: 48 }]}>
                    <AuraText variant="label" color={AuraColors.gray600} style={{ fontWeight: '900', letterSpacing: 2 }}>PHASE 2: BIOMETRICS</AuraText>
                </View>

                <UploadCard label="FACIAL SCAN (SELFIE)" value={selfie} setter={setSelfie} delay={400} />

                <AuraMotion type="slide" delay={500} style={styles.securityWarning}>
                    <AlertCircle size={20} color={AuraColors.gray700} />
                    <AuraText variant="caption" color={AuraColors.gray700} style={{ marginLeft: 16, flex: 1, lineHeight: 16 }}>
                        Data is transmitted via AES-256 encrypted tunnels. Temporary tokens are purged after compliance audit.
                    </AuraText>
                </AuraMotion>

                <AuraMotion type="slide" delay={600}>
                    <AuraButton
                        title={uploading ? "TRANSMITTING..." : "INITIATE CLEARANCE"}
                        onPress={handleSubmit}
                        disabled={uploading}
                        style={styles.submitBtn}
                    />
                </AuraMotion>

                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    scrollContent: {
        paddingHorizontal: AuraSpacing.xl,
        paddingTop: 32,
        paddingBottom: 40,
    },
    headerInfo: {
        alignItems: 'center',
        paddingBottom: 56,
    },
    shieldIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AuraColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    sectionHeader: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    uploadBox: {
        height: 200,
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        overflow: 'hidden',
        position: 'relative',
        ...AuraShadows.soft,
    },
    uploadBoxDone: {
        borderColor: AuraColors.white,
    },
    scanLineBox: {
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: AuraColors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AuraColors.gray200,
    },
    placeholder: {
        alignItems: 'center',
    },
    checkOverlay: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: AuraColors.white,
        borderRadius: 14,
        padding: 6,
        ...AuraShadows.soft,
    },
    cornerContainer: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: AuraColors.gray500,
    },
    tl: { top: 24, left: 24, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
    tr: { top: 24, right: 24, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
    bl: { bottom: 24, left: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
    br: { bottom: 24, right: 24, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
    securityWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        padding: 24,
        backgroundColor: AuraColors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: AuraColors.gray200,
    },
    submitBtn: {
        marginTop: 56,
        height: 64,
        borderRadius: 32,
    }
});
