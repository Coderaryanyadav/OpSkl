import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuraColors, AuraSpacing } from '../theme/aura';
import { AuraText } from './AuraText';
import { ChevronLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

interface AuraHeaderProps {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    transparent?: boolean;
    style?: ViewStyle;
}

export const AuraHeader: React.FC<AuraHeaderProps> = ({
    title,
    showBack = true,
    onBack,
    rightElement,
    transparent = false,
    style
}) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onBack) onBack();
        else navigation.goBack();
    };

    const renderContent = () => (
        <View style={[styles.content, { height: 56 }, style]}>
            <View style={styles.left}>
                {showBack && (
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
                        <ChevronLeft color={AuraColors.white} size={28} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.center}>
                <AuraText variant="h3" align="center" numberOfLines={1} style={styles.titleText}>
                    {title}
                </AuraText>
            </View>

            <View style={styles.right}>
                {rightElement || <View style={{ width: 40 }} />}
            </View>
        </View>
    );

    if (transparent) {
        return (
            <BlurView
                intensity={40}
                tint="dark"
                style={[styles.container, styles.blurContainer, { paddingTop: insets.top || 44 }]}
            >
                {renderContent()}
            </BlurView>
        );
    }

    return (
        <View style={[styles.container, styles.solidContainer, { paddingTop: insets.top || 44 }]}>
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 100,
        width: '100%',
    },
    blurContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    solidContainer: {
        backgroundColor: AuraColors.background,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: AuraSpacing.m,
    },
    left: {
        width: 60,
        justifyContent: 'center',
    },
    center: {
        flex: 1,
        alignItems: 'center',
    },
    right: {
        width: 60,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    titleText: {
        fontWeight: '800',
        letterSpacing: 0.5,
    }
});
