import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../core/api/supabase';
import { AuraText } from '../../../core/components/AuraText';
import { AuraInput } from '../../../core/components/AuraInput';
import { AuraButton } from '../../../core/components/AuraButton';
import { AuraColors, AuraSpacing, AuraShadows, AuraBorderRadius } from '../../../core/theme/aura';
import { ArrowRight } from 'lucide-react-native';
import { checkRateLimit, secureLog } from '../../../core/utils/security';
import { validateEmail } from '../../../utils/validation';
import * as Device from 'expo-device';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function handleLogin() {
        setErrorMsg(null);

        if (!checkRateLimit('login_attempt', 5, 60000)) {
            const msg = 'Too Many Attempts. Please wait a minute before trying again.';
            Alert.alert('Too Many Attempts', msg);
            setErrorMsg(msg);
            return;
        }

        if (!validateEmail(email)) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }
        if (!password) {
            setErrorMsg('Please enter your password.');
            return;
        }

        setLoading(true);
        try {
            const deviceInfo = {
                model: Device.modelName,
                os: Device.osName,
                version: Device.osVersion
            };

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) throw error;

            if (data.session) {
                secureLog('User logged in successfully', { device: deviceInfo });
            } else {
                throw new Error("Session not created. Please check your credentials.");
            }

        } catch (err: any) {
            secureLog('Login failed', err.message);
            setErrorMsg(err.message || "Invalid credentials.");
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
                        <View style={styles.logoInner} />
                    </View>
                    <AuraText variant="h1" style={styles.welcomeTitle}>Welcome Back</AuraText>
                    <AuraText variant="bodyLarge" color={AuraColors.gray400} style={{ marginTop: 8 }}>
                        Sign in to access your dashboard
                    </AuraText>
                </View>

                <View style={styles.form}>
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

                    <TouchableOpacity style={styles.forgot}>
                        <AuraText variant="caption" color={AuraColors.gray400}>Forgot Password?</AuraText>
                    </TouchableOpacity>

                    {errorMsg && (
                        <View style={styles.errorBox}>
                            <AuraText variant="caption" color={AuraColors.error} style={{ textAlign: 'center' }}>
                                {errorMsg}
                            </AuraText>
                        </View>
                    )}

                    <AuraButton
                        title={loading ? "Authenticating..." : "Sign In"}
                        onPress={handleLogin}
                        loading={loading}
                        style={{ marginTop: 32 }}
                        icon={<ArrowRight color={AuraColors.white} size={20} />}
                    />
                </View>

                <View style={styles.footer}>
                    <AuraText variant="caption" color={AuraColors.gray400}>Don't have an account? </AuraText>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <AuraText variant="caption" color={AuraColors.primary} style={{ fontWeight: '700' }}>
                            Create Account
                        </AuraText>
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
    logoInner: {
        width: 32,
        height: 32,
        backgroundColor: AuraColors.white,
        borderRadius: 8,
    },
    welcomeTitle: {
        marginTop: 32,
        letterSpacing: -1.2,
        fontWeight: '800',
    },
    form: {
        width: '100%',
    },
    forgot: {
        alignSelf: 'flex-end',
        marginTop: -8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 48,
    },
    errorBox: {
        padding: 16,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: AuraBorderRadius.m,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
        marginTop: 24,
    }
});
