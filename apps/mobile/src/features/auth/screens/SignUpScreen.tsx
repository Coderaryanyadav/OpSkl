import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@api/supabase';
import { AuraText } from '@core/components/AuraText';
import { AuraInput } from '@core/components/AuraInput';
import { AuraButton } from '@core/components/AuraButton';
import { AuraColors, AuraSpacing } from '@theme/aura';
import { ArrowRight } from 'lucide-react-native';
import { checkRateLimit, secureLog } from '@core/utils/security';
import { validateEmail, validatePassword } from '@core/utils/validation';
import { useAura } from '@core/context/AuraProvider';

export default function SignUpScreen() {
    const navigation = useNavigation<any>();
    const { showDialog } = useAura();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function handleSignUp() {
        setErrorMsg(null);

        if (!checkRateLimit('signup_attempt', 3, 60000)) {
            setErrorMsg('Too many attempts. Please try again later.');
            return;
        }

        if (!fullName.trim()) {
            setErrorMsg('Please enter your full name.');
            return;
        }
        if (!validateEmail(email)) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }
        if (!validatePassword(password)) {
            setErrorMsg('Password must be at least 8 characters with numbers and letters.');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        active_role: 'talent'
                    }
                }
            });

            if (error) throw error;

            if (data.session) {
                secureLog('User created successfully');
            } else if (data.user && !data.session) {
                showDialog({
                    title: 'Verification Sent',
                    message: 'Please check your email to verify your account and activate your talent node.',
                    primaryLabel: 'Acknowledged',
                    onConfirm: () => navigation.navigate('Login')
                });
            }

        } catch (error: any) {
            secureLog('Signup error', error);
            showDialog({
                title: 'Provisioning Failed',
                message: error.message || 'An error occurred during talent enrollment.',
                primaryLabel: 'Retry',
                onConfirm: () => { }
            });
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
                    <AuraText variant="h1" align="center">Create Account</AuraText>
                    <AuraText variant="body" color={AuraColors.gray600} align="center">
                        Join to find gigs or hire talent
                    </AuraText>
                </View>

                <View style={styles.form}>
                    <AuraInput
                        label="Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                        icon="user"
                        autoCapitalize="words"
                    />

                    <AuraInput
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        icon="mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <AuraInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        icon="lock"
                        secureTextEntry
                    />

                    {errorMsg && (
                        <View style={styles.errorBox}>
                            <AuraText variant="caption" color={AuraColors.error} style={{ textAlign: 'center' }}>
                                {errorMsg}
                            </AuraText>
                        </View>
                    )}

                    <AuraButton
                        title={loading ? "Creating Account..." : "Sign Up"}
                        onPress={handleSignUp}
                        loading={loading}
                        style={{ marginTop: 24 }}
                        icon={<ArrowRight color={AuraColors.black} size={20} />}
                    />
                </View>

                <View style={styles.footer}>
                    <AuraText variant="caption" color={AuraColors.gray600}>Already have an account? </AuraText>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <AuraText variant="caption" color={AuraColors.white} style={{ fontWeight: 'bold' }}>Sign In</AuraText>
                    </TouchableOpacity>
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
        marginBottom: 48,
    },
    form: {
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
    },
    errorBox: {
        padding: AuraSpacing.m,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: AuraBorderRadius.m,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
        marginTop: 20,
    }
});
