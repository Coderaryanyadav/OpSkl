import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '@api/supabase';
import { AuraText } from '@core/components/AuraText';
import { AuraInput } from '@core/components/AuraInput';
import { AuraButton } from '@core/components/AuraButton';
import { AuraColors, AuraSpacing, AuraShadows, AuraBorderRadius } from '@theme/aura';
import { ArrowRight, Phone, Shield } from 'lucide-react-native';
import { checkRateLimit, secureLog } from '@core/utils/security';
import { useAura } from '@core/context/AuraProvider';

export default function LoginScreen() {

    const { showDialog, showToast } = useAura();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);

    async function handleSendOtp() {
        if (phone.length < 10) {
            showToast({ message: 'Please enter a valid phone number.', type: 'error' });
            return;
        }

        const isAllowed = await checkRateLimit('otp_request', 3, 60000);
        if (!isAllowed) {
            showDialog({
                title: 'Limit Exceeded',
                message: 'Security protocol: Too many attempts. Please wait 60 seconds.',
                type: 'warning',
                onConfirm: () => { }
            });
            return;
        }

        setLoading(true);
        try {
            // In a real app, you'd use +91 or a country picker. Hardcoding +91 for Bharat launch.
            const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            const { error } = await supabase.auth.signInWithOtp({
                phone: fullPhone,
            });

            if (error) throw error;

            setStep('otp');
            showToast({ message: 'OTP Sent to your mobile.', type: 'success' });
        } catch (err: any) {
            secureLog('OTP failed', err.message);
            showToast({ message: err.message || "Failed to send OTP", type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp() {
        if (otp.length < 4) {
            showToast({ message: 'Please enter the verification code.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            const { data, error } = await supabase.auth.verifyOtp({
                phone: fullPhone,
                token: otp,
                type: 'sms',
            });

            if (error) throw error;

            if (data.session) {
                secureLog('Phone Login Success');
            } else {
                throw new Error("Verification failed. Please check the code.");
            }

        } catch (err: any) {
            secureLog('OTP Verification failed', err.message);
            showToast({ message: err.message || "Invalid OTP", type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.logoBox}>
                        <Shield color={AuraColors.white} size={40} />
                    </View>
                    <AuraText variant="h1" style={styles.welcomeTitle}>OpSkl</AuraText>
                    <AuraText variant="bodyLarge" color={AuraColors.gray400} style={{ marginTop: 8 }}>
                        {step === 'phone' ? 'Enter your mobile to begin' : 'Enter the verification signal'}
                    </AuraText>
                </View>

                <View style={styles.form}>
                    {step === 'phone' ? (
                        <AuraInput
                            label="Mobile Number"
                            value={phone}
                            onChangeText={setPhone}
                            leftIcon={<Phone size={18} color={AuraColors.primary} />}
                            keyboardType="phone-pad"
                            placeholder="99999 99999"
                        />
                    ) : (
                        <AuraInput
                            label="Verification Code (OTP)"
                            value={otp}
                            onChangeText={setOtp}
                            leftIcon={<Shield size={18} color={AuraColors.primary} />}
                            keyboardType="number-pad"
                            placeholder="XXXX"
                        />
                    )}

                    {step === 'otp' && (
                        <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
                            <AuraText variant="caption" color={AuraColors.gray500}>Change Number</AuraText>
                        </TouchableOpacity>
                    )}

                    <AuraButton
                        title={loading ? "Processing..." : (step === 'phone' ? "Generate OTP" : "Verify & Access")}
                        onPress={step === 'phone' ? handleSendOtp : handleVerifyOtp}
                        loading={loading}
                        style={{ marginTop: 32 }}
                        icon={<ArrowRight color={AuraColors.white} size={20} />}
                    />
                </View>

                <View style={styles.footer}>
                    <AuraText variant="caption" color={AuraColors.gray400}>By continuing, you authorize encrypted access. </AuraText>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    scroll: {
        flexGrow: 1,
        padding: AuraSpacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 64,
    },
    logoBox: {
        width: 80,
        height: 80,
        backgroundColor: AuraColors.primary,
        borderRadius: AuraBorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...AuraShadows.floating,
    },
    welcomeTitle: {
        marginTop: 32,
        letterSpacing: -1.2,
        fontWeight: '800',
    },
    form: {
        width: '100%',
    },
    backBtn: {
        marginTop: 8,
        alignSelf: 'flex-end',
    },
    footer: {
        justifyContent: 'center',
        marginTop: 48,
        paddingHorizontal: 32,
    },
});
