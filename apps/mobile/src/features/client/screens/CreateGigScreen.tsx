import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraColors, AuraSpacing, AuraBorderRadius } from '@theme/aura';
import LocationPicker from '@core/components/LocationPicker';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AuraText } from '@core/components/AuraText';
import { AuraInput } from '@core/components/AuraInput';
import { AuraButton } from '@core/components/AuraButton';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraMotion } from '@core/components/AuraMotion';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';
import {
    MapPin, Sparkles,
    Camera, Video, Palette, GraduationCap, Bike,
    Megaphone, Smartphone, Target
} from 'lucide-react-native';
import { supabase } from '@api/supabase';
import { useNavigation } from '@react-navigation/native';

const MISSION_TYPES = [
    { label: 'Social', icon: Smartphone, color: '#007AFF' },
    { label: 'Creative', icon: Sparkles, color: '#5856D6' },
    { label: 'Technical', icon: Video, color: '#FF2D55' },
    { label: 'Design', icon: Palette, color: '#AF52DE' },
    { label: 'Visuals', icon: Camera, color: '#FF9500' },
    { label: 'Intel', icon: GraduationCap, color: '#34C759' },
    { label: 'Logistics', icon: Bike, color: '#5AC8FA' },
    { label: 'Signal', icon: Megaphone, color: '#FF3B30' }
];

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function CreateGigScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const { showDialog, showToast } = useAura();
    const haptics = useAuraHaptics();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pay, setPay] = useState('');
    const [duration, setDuration] = useState('60');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
    const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const [loading, setLoading] = useState(false);

    const predictPrice = useCallback(async () => {
        if (!duration || !selectedCategory) return;
        setIsPredicting(true);

        const baseRatePerMinute = 8;
        let est = parseInt(duration || '60', 10) * baseRatePerMinute;
        if (urgency === 'high') est *= 1.4;

        if (!GEMINI_API_KEY) {
            setTimeout(() => {
                setPredictedPrice(Math.floor(est));
                setIsPredicting(false);
            }, 800);
            return;
        }

        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Estimate a fair price in Indian Rupees (INR) for a gig: "${selectedCategory}" lasting ${duration} minutes with ${urgency} urgency. Return ONLY the number.`;
            const result = await model.generateContent(prompt);
            const price = parseInt(result.response.text().replace(/[^0-9]/g, ''), 10);
            setPredictedPrice(!isNaN(price) ? price : Math.floor(est));
        } catch {
            setPredictedPrice(Math.floor(est));
        } finally {
            setIsPredicting(false);
        }
    }, [duration, selectedCategory, urgency]);

    const handleCreate = async () => {
        if (!selectedCategory || !title || !description || !pay || !location) {
            haptics.error();
            showToast({ message: "Parameters incomplete. Define mission scope.", type: 'error' });
            return;
        }

        setLoading(true);
        haptics.heavy();

        try {
            if (!user) throw new Error("Authentication node offline.");

            const { error } = await supabase.from('gigs').insert({
                client_id: user.id,
                title: title.trim(),
                description: description.trim(),
                pay_amount_cents: parseInt(pay, 10) * 100,
                duration_minutes: parseInt(duration, 10),
                urgency_level: urgency,
                status: 'open',
                location_point: `POINT(${location.lng} ${location.lat})`,
                category: selectedCategory
            });

            if (error) throw error;

            haptics.success();
            showDialog({
                title: 'Deployment Active',
                message: 'Mission has been broadcasted to the global operative network.',
                type: 'success',
                onConfirm: () => navigation.goBack()
            });
        } catch (err: any) {
            haptics.error();
            showToast({ message: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <AuraHeader title="Mission Deployment" showBack />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Mission Type Selection */}
                <View style={styles.section}>
                    <AuraText variant="label" color={AuraColors.gray500} style={styles.sectionTitle}>MISSION CLASSIFICATION</AuraText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                        {MISSION_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.label}
                                style={[
                                    styles.categoryBtn,
                                    selectedCategory === type.label && styles.categoryBtnActive
                                ]}
                                onPress={() => {
                                    setSelectedCategory(type.label);
                                    haptics.selection();
                                    predictPrice();
                                }}
                            >
                                <View style={[styles.iconBox, { backgroundColor: `${type.color}15` }]}>
                                    <type.icon size={22} color={type.color} />
                                </View>
                                <AuraText variant="caption" color={selectedCategory === type.label ? AuraColors.white : AuraColors.gray500} style={{ fontWeight: '800' }}>
                                    {type.label.toUpperCase()}
                                </AuraText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Main Intel Form */}
                <View style={styles.form}>
                    <AuraInput
                        label="Mission Title"
                        value={title}
                        onChangeText={setTitle}
                        icon="search"
                    />

                    <AuraInput
                        label="Objective Briefing"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        style={styles.textArea}
                    />

                    {/* Operational Area */}
                    <View style={styles.fieldSection}>
                        <AuraText variant="label" color={AuraColors.gray500} style={styles.sectionTitle}>OPERATIONAL PERIMETER</AuraText>
                        <View style={styles.mapCard}>
                            <LocationPicker onLocationSelect={setLocation} />
                            {!location && (
                                <View style={styles.mapLock}>
                                    <MapPin size={32} color={AuraColors.primary} />
                                    <AuraText variant="h3" style={{ marginTop: 12 }}>Lock Coordinates</AuraText>
                                    <AuraText variant="caption" color={AuraColors.gray500}>Select precise target area on map</AuraText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Logistics Row */}
                    <View style={styles.logisticsRow}>
                        <View style={{ flex: 1 }}>
                            <AuraInput
                                label="Window (m)"
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="numeric"
                                icon="phone"
                                onEndEditing={predictPrice}
                            />
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={{ flex: 1 }}>
                            <AuraInput
                                label="Bounty (₹)"
                                value={pay}
                                onChangeText={setPay}
                                keyboardType="numeric"
                                icon="lock"
                            />
                        </View>
                    </View>

                    {/* AI Advisor */}
                    {(predictedPrice || isPredicting) ? (
                        <AuraMotion type="slide">
                            <View style={styles.aiAdvisor}>
                                <View style={styles.aiHeader}>
                                    <Sparkles size={16} color={AuraColors.primary} />
                                    <AuraText variant="label" color={AuraColors.primary} style={{ marginLeft: 8 }}>PREDICTIVE ADVISOR</AuraText>
                                </View>
                                {isPredicting ? (
                                    <ActivityIndicator color={AuraColors.primary} size="small" />
                                ) : (
                                    <AuraText variant="bodyLarge">
                                        Market rate suggestion: <AuraText variant="h3" color={AuraColors.primary}>₹{predictedPrice}</AuraText>
                                    </AuraText>
                                )}
                            </View>
                        </AuraMotion>
                    ) : null}

                    {/* Platform Fee Transparency */}
                    {pay && parseInt(pay) > 0 && (
                        <AuraMotion type="slide">
                            <View style={styles.feeCard}>
                                <View style={styles.feeHeader}>
                                    <Target size={16} color={AuraColors.warning} />
                                    <AuraText variant="label" color={AuraColors.warning} style={{ marginLeft: 8 }}>PAYMENT BREAKDOWN</AuraText>
                                </View>
                                <View style={styles.feeRow}>
                                    <AuraText variant="body" color={AuraColors.gray400}>Worker receives</AuraText>
                                    <AuraText variant="bodyBold">₹{parseInt(pay)}</AuraText>
                                </View>
                                <View style={styles.feeRow}>
                                    <AuraText variant="body" color={AuraColors.gray400}>Platform fee (15%)</AuraText>
                                    <AuraText variant="bodyBold" color={AuraColors.gray500}>₹{Math.round(parseInt(pay) * 0.15)}</AuraText>
                                </View>
                                <View style={[styles.feeRow, styles.feeDivider]}>
                                    <AuraText variant="bodyBold">Total you pay</AuraText>
                                    <AuraText variant="h3" color={AuraColors.primary}>₹{Math.round(parseInt(pay) * 1.15)}</AuraText>
                                </View>
                                <AuraText variant="caption" color={AuraColors.gray600} style={{ marginTop: 8 }}>
                                    Funds held in escrow until delivery confirmed
                                </AuraText>
                            </View>
                        </AuraMotion>
                    )}

                    {/* Priority Allocation */}
                    <View style={styles.prioritySection}>
                        <AuraText variant="label" color={AuraColors.gray500} style={styles.sectionTitle}>PRIORITY LEVEL</AuraText>
                        <View style={styles.priorityRow}>
                            {(['low', 'medium', 'high'] as const).map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.priorityBtn,
                                        urgency === level && styles.priorityBtnActive,
                                        urgency === level && level === 'high' && { borderColor: AuraColors.error }
                                    ]}
                                    onPress={() => { setUrgency(level); haptics.light(); }}
                                >
                                    <AuraText
                                        variant="label"
                                        color={urgency === level ? (level === 'high' ? AuraColors.error : AuraColors.primary) : AuraColors.gray600}
                                        style={{ fontWeight: '900' }}
                                    >
                                        {level.toUpperCase()}
                                    </AuraText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Tactical Deployment */}
                <View style={styles.footer}>
                    <AuraButton
                        title={loading ? "SIGNALING NETWORK..." : "AUTHORIZE DEPLOYMENT"}
                        onPress={handleCreate}
                        disabled={loading}
                        loading={loading}
                        icon={<Target size={20} color={AuraColors.white} />}
                    />
                    <AuraText variant="caption" align="center" color={AuraColors.gray600} style={{ marginTop: 16 }}>
                        Authorized deployment signals are sent to all verified operatives within range.
                    </AuraText>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    scrollContent: {
        paddingTop: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        paddingHorizontal: AuraSpacing.xl,
        marginBottom: 16,
        letterSpacing: 2,
        fontWeight: '800',
    },
    categoryRow: {
        paddingHorizontal: AuraSpacing.xl,
        gap: 12,
    },
    categoryBtn: {
        width: 100,
        padding: 16,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
    },
    categoryBtnActive: {
        borderColor: AuraColors.primary,
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    form: {
        paddingHorizontal: AuraSpacing.xl,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    fieldSection: {
        marginTop: 12,
        marginBottom: 24,
    },
    mapCard: {
        height: 200,
        borderRadius: AuraBorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
        backgroundColor: AuraColors.surfaceElevated,
        position: 'relative',
    },
    mapLock: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logisticsRow: {
        flexDirection: 'row',
    },
    aiAdvisor: {
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.2)',
        marginBottom: 24,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    prioritySection: {
        marginBottom: 40,
    },
    priorityRow: {
        flexDirection: 'row',
        gap: 12,
    },
    priorityBtn: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
    },
    priorityBtnActive: {
        borderColor: AuraColors.primary,
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    feeCard: {
        backgroundColor: 'rgba(255, 159, 10, 0.05)',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 159, 10, 0.2)',
        marginBottom: 24,
    },
    feeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    feeDivider: {
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 159, 10, 0.2)',
    },
    footer: {
        paddingHorizontal: AuraSpacing.xl,
        marginTop: 16,
    }
});
