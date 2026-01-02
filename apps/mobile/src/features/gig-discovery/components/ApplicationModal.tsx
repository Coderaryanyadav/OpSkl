import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { AuraColors, AuraSpacing } from '@theme/aura';
import { AuraText } from '@core/components/AuraText';
import { AuraInput } from '@core/components/AuraInput';
import { AuraButton } from '@core/components/AuraButton';
import { AuraMotion } from '@core/components/AuraMotion';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { X, Copy } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApplicationModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (message: string) => void;
    loading?: boolean;
}

const TEMPLATES_KEY = '@opskl_app_templates';

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ visible, onClose, onSubmit, loading }) => {
    const [message, setMessage] = useState('');
    const [templates, setTemplates] = useState<string[]>([]);
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const haptics = useAuraHaptics();

    useEffect(() => {
        if (visible) {
            loadTemplates();
        }
    }, [visible]);

    const loadTemplates = async () => {
        try {
            const stored = await AsyncStorage.getItem(TEMPLATES_KEY);
            if (stored) setTemplates(JSON.parse(stored));
        } catch (error) {
            if (__DEV__) console.error(error);
            // Templates failed to load, user can still apply manually
        }
    };

    const handleSaveTemplate = async (text: string) => {
        const newTemplates = [text, ...templates].slice(0, 5); // Keep last 5
        setTemplates(newTemplates);
        await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates));
    };

    const handleApply = async () => {
        if (saveAsTemplate && message.trim()) {
            await handleSaveTemplate(message.trim());
        }
        onSubmit(message.trim());
    };

    const selectTemplate = (t: string) => {
        setMessage(t);
        haptics.selection();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <AuraMotion type="slide" style={styles.modal}>
                    <View style={styles.header}>
                        <AuraText variant="h3">Transmit Introduction</AuraText>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={AuraColors.gray400} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <AuraText variant="label" color={AuraColors.gray500} style={{ marginBottom: 12 }}>
                            QUICK TEMPLATES
                        </AuraText>
                        <View style={styles.templateGrid}>
                            {templates.length === 0 ? (
                                <AuraText variant="caption" color={AuraColors.gray600}>No templates saved yet.</AuraText>
                            ) : (
                                templates.map((t, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.templateChip}
                                        onPress={() => selectTemplate(t)}
                                    >
                                        <Copy size={12} color={AuraColors.primary} />
                                        <AuraText variant="caption" numberOfLines={1} style={{ marginLeft: 6 }}>
                                            {t.substring(0, 20)}...
                                        </AuraText>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        <AuraInput
                            placeholder="Briefly describe your tactical advantage..."
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            style={{ height: 150, marginTop: 24 }}
                        />

                        <View style={styles.switchRow}>
                            <AuraText variant="body">Save as Quick Template</AuraText>
                            <Switch
                                value={saveAsTemplate}
                                onValueChange={setSaveAsTemplate}
                                trackColor={{ false: AuraColors.gray800, true: AuraColors.primary }}
                                thumbColor={AuraColors.white}
                            />
                        </View>
                    </ScrollView>

                    <AuraButton
                        title={loading ? "TRANSMITTING..." : "CONFIRM APPLICATION"}
                        onPress={handleApply}
                        loading={loading}
                        variant="primary"
                        style={{ marginTop: 24 }}
                    />
                </AuraMotion>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: AuraColors.surfaceElevated,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: AuraSpacing.xl,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    templateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    templateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AuraColors.surface,
        paddingHorizontal: AuraSpacing.m,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        padding: AuraSpacing.m,
        backgroundColor: AuraColors.surface,
        borderRadius: AuraBorderRadius.m,
    }
});
