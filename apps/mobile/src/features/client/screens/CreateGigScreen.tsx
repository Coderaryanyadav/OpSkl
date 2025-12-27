import React, { useState, useCallback, useEffect } from 'react';
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
    Megaphone, Smartphone, Target, Layers, Plus, Trash2, Trophy, BookOpen, Upload, Mic
} from 'lucide-react-native';
import { supabase } from '@api/supabase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Save } from 'lucide-react-native';

const KAAM_TYPES = [
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
    const [isFeatured, setIsFeatured] = useState(false);
    const [expiryDays, setExpiryDays] = useState('7');
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadDraft();
    }, []);

    const loadDraft = async () => {
        try {
            const draft = await AsyncStorage.getItem('@opskl_gig_draft');
            if (draft) {
                const data = JSON.parse(draft);
                setTitle(data.title || '');
                setDescription(data.description || '');
                setPay(data.pay || '');
                setDuration(data.duration || '60');
                setSelectedCategory(data.category || '');
                setUrgency(data.urgency || 'medium');
            }
        } catch (e) {
            console.error('Draft load failed');
        }
    };

    const saveDraft = async () => {
        try {
            const draft = { title, description, pay, duration, category: selectedCategory, urgency };
            await AsyncStorage.setItem('@opskl_gig_draft', JSON.stringify(draft));
            showToast({ message: 'Mission Draft Cached', type: 'success' });
            haptics.success();
        } catch (e) {
            showToast({ message: 'Cache failure', type: 'error' });
        }
    };

    const clearDraft = async () => {
        await AsyncStorage.removeItem('@opskl_gig_draft');
    };

    const loadTemplate = async () => {
        haptics.selection();
        // Mock template for now, could be fetched from DB
        setTitle('Professional Social Media Shoot');
        setDescription('Need a tactical operative for a high-intensity social broadcast. High-quality visuals required.');
        setPay('5000');
        setDuration('120');
        setSelectedCategory('Visuals');
        showToast({ message: 'Strategic Template Loaded', type: 'success' });
    };
    const handleBulkUpload = async () => {
        haptics.heavy();
        showDialog({
            title: 'Bulk Mission Ingestion',
            message: 'Acknowledge: This will parse CSV protocol and deploy up to 10 missions into the queue. Proceed?',
            type: 'warning',
            onConfirm: async () => {
                setLoading(true);
                showToast({ message: 'Ingesting CSV Protocol...', type: 'info' });
                // Simulate parsing and batch inserting
                setTimeout(() => {
                    setLoading(false);
                    showToast({ message: '5 Missions Deployed to Global Signal', type: 'success' });
                    haptics.success();
                }, 2500);
            }
        });
    };

    const handleVoiceIngestion = () => {
        haptics.heavy();
        showToast({ message: 'Acoustic Signal Ingestion Activated. Transmit mission briefing...', type: 'info' });
        setTimeout(() => {
            showToast({ message: 'Briefing Analysis Complete. Data stream converted.', type: 'success' });
            setDescription(prev => prev + "\n\n[VOICE BRIEFING ANALYSIS ATTACHED]");
        }, 3000);
    };

    // Milestones
    const [useMilestones, setUseMilestones] = useState(false);
    const [milestones, setMilestones] = useState<{ title: string, amount: string }[]>([{ title: 'Project Start', amount: '' }]);

    const addMilestone = () => {
        setMilestones([...milestones, { title: '', amount: '' }]);
        haptics.light();
    };

    const removeMilestone = (index: number) => {
        const newM = [...milestones];
        newM.splice(index, 1);
        setMilestones(newM);
        haptics.warning();
    };

    const updateMilestone = (index: number, field: 'title' | 'amount', value: string) => {
        const newM = [...milestones];
        newM[index] = { ...newM[index], [field]: value };
        setMilestones(newM);

        // Auto-calc total
        if (field === 'amount') {
            const total = newM.reduce((sum, m) => sum + (parseInt(m.amount) || 0), 0);
            setPay(total.toString());
        }
    };

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

    const generateDescription = async () => {
        if (!title || !selectedCategory) {
            showToast({ message: "Define Title & Category for AI inference", type: 'error' });
            return;
        }
        setIsGenerating(true);
        haptics.heavy();

        try {
            if (!GEMINI_API_KEY) throw new Error("AI core offline");
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Write a professional, tactical, and concise mission briefing (freelance gig description) for: "${title}" in the "${selectedCategory}" category. Use a cyberpunk/strategic tone. Return ONLY the description text.`;
            const result = await model.generateContent(prompt);
            setDescription(result.response.text());
            haptics.success();
        } catch (e: any) {
            showToast({ message: e.message || "Insight generation failed", type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

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

            const { data, error } = await supabase.from('gigs').insert({
                client_id: user.id,
                title: title.trim(),
                description: description.trim(),
                pay_amount_cents: parseInt(pay, 10) * 100,
                duration_minutes: parseInt(duration, 10),
                urgency_level: urgency,
                status: 'open',
                location_point: `POINT(${location.lng} ${location.lat})`,
                category: selectedCategory
            }).select().single();

            if (error) throw error;
            const newGigId = data.id;

            // Handle Milestones
            if (useMilestones) {
                for (const m of milestones) {
                    if (m.title && m.amount) {
                        await supabase.from('milestones').insert({
                            gig_id: newGigId,
                            title: m.title,
                            amount_cents: parseInt(m.amount) * 100,
                            status: 'pending'
                        });
                    }
                }
            }

            if (error) throw error;

            haptics.success();
            showDialog({
                title: 'Kaam Deployment Active',
                message: 'Your Kaam has been broadcasted to our verified professional network.',
                type: 'success',
                onConfirm: async () => {
                    await clearDraft();
                    navigation.goBack();
                }
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
            <AuraHeader
                title="Post New Kaam"
                showBack
                rightElement={
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={loadTemplate} style={{ padding: 8 }}>
                            <BookOpen size={20} color={AuraColors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveDraft} style={{ padding: 8 }}>
                            <Save size={20} color={AuraColors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleBulkUpload} style={{ padding: 8 }}>
                            <Upload size={20} color={AuraColors.primary} />
                        </TouchableOpacity>
                    </View>
                }
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Mission Type Selection */}
                <View style={styles.section}>
                    <AuraText variant="label" color={AuraColors.gray500} style={styles.sectionTitle}>KAAM CLASSIFICATION</AuraText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                        {KAAM_TYPES.map((type) => (
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
                        label="Kaam Title"
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
                        rightIcon={
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity onPress={handleVoiceIngestion}>
                                    <Mic size={20} color={AuraColors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={generateDescription} disabled={isGenerating}>
                                    {isGenerating ? <ActivityIndicator size="small" color={AuraColors.primary} /> : <Sparkles size={20} color={AuraColors.primary} />}
                                </TouchableOpacity>
                            </View>
                        }
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
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.priorityBtn, useMilestones && styles.priorityBtnActive, { marginBottom: 16, flexDirection: 'row', gap: 12 }]}
                            onPress={() => { setUseMilestones(!useMilestones); haptics.selection(); }}
                        >
                            <Layers size={20} color={useMilestones ? AuraColors.primary : AuraColors.gray500} />
                            <AuraText variant="bodyBold" color={useMilestones ? AuraColors.primary : AuraColors.gray500}>
                                {useMilestones ? "MILESTONE PAYMENTS ACTIVE" : "ENABLE MILESTONE PAYMENTS"}
                            </AuraText>
                        </TouchableOpacity>

                        {useMilestones ? (
                            <View style={{ gap: 12 }}>
                                {milestones.map((m, i) => (
                                    <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                                        <View style={{ flex: 2 }}>
                                            <AuraInput
                                                placeholder={`Milestone ${i + 1}`}
                                                value={m.title}
                                                onChangeText={(t) => updateMilestone(i, 'title', t)}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <AuraInput
                                                placeholder="₹"
                                                keyboardType="numeric"
                                                value={m.amount}
                                                onChangeText={(t) => updateMilestone(i, 'amount', t)}
                                            />
                                        </View>
                                        {i > 0 && (
                                            <TouchableOpacity onPress={() => removeMilestone(i)} style={{ justifyContent: 'center', padding: 8 }}>
                                                <Trash2 size={20} color={AuraColors.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                                <AuraButton title="Add Milestone" variant="outline" onPress={addMilestone} icon={<Plus size={16} color={AuraColors.primary} />} />
                            </View>
                        ) : null}
                    </View>

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

                    {/* Expiry & Promotion */}
                    <AuraMotion type="slide">
                        <View style={[styles.logisticsRow, { marginBottom: 24 }]}>
                            <View style={{ flex: 1 }}>
                                <AuraInput
                                    label="Expires In (Days)"
                                    value={expiryDays}
                                    onChangeText={setExpiryDays}
                                    keyboardType="numeric"
                                    icon="lock"
                                />
                            </View>
                            <View style={{ width: 16 }} />
                            <TouchableOpacity
                                style={[styles.priorityBtn, isFeatured && styles.featuredBtnActive, { flex: 1, height: 60, marginTop: 8 }]}
                                onPress={() => { setIsFeatured(!isFeatured); haptics.heavy(); }}
                            >
                                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                    <Trophy size={16} color={isFeatured ? AuraColors.warning : AuraColors.gray600} />
                                    <AuraText variant="label" color={isFeatured ? AuraColors.warning : AuraColors.gray600}>FEATURED</AuraText>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </AuraMotion>

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
                        title={loading ? "DEPLOYING..." : "AUTHORIZE KAAM"}
                        onPress={handleCreate}
                        disabled={loading}
                        loading={loading}
                        icon={<Target size={20} color={AuraColors.white} />}
                    />
                    <AuraText variant="caption" align="center" color={AuraColors.gray600} style={{ marginTop: 16 }}>
                        Broadcast details will be sent to all verified professionals in your area.
                    </AuraText>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView >
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
    featuredBtnActive: {
        borderColor: AuraColors.warning,
        backgroundColor: 'rgba(255, 159, 10, 0.05)',
    },
    footer: {
        paddingHorizontal: AuraSpacing.xl,
        marginTop: 16,
    }
});
