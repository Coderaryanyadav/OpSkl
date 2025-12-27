import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AuraHeader } from '../../../core/components/AuraHeader';
import { AuraText } from '../../../core/components/AuraText';
import { AuraColors } from '../../../core/theme/aura';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function PrivacyPolicyScreen() {
    return (
        <View style={styles.container}>
            <AuraHeader title="Legal Protocol" showBack />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeIn.duration(800)}>
                    <AuraText variant="h2" style={{ marginBottom: 24 }}>Privacy Policy</AuraText>

                    <View style={styles.section}>
                        <AuraText variant="bodyBold" style={{ marginBottom: 8 }}>1. DATA COLLECTION</AuraText>
                        <AuraText variant="body" color={AuraColors.gray500}>
                            We collect minimal operational data required to facilitate secure gig fulfillment. This includes your profile identity, location during active missions, and transaction history.
                        </AuraText>
                    </View>

                    <View style={styles.section}>
                        <AuraText variant="bodyBold" style={{ marginBottom: 8 }}>2. ENCRYPTION PROTOCOLS</AuraText>
                        <AuraText variant="body" color={AuraColors.gray500}>
                            All communications and documents are processed through end-to-end encrypted channels. Identity verification data is purged post-validation.
                        </AuraText>
                    </View>

                    <View style={styles.section}>
                        <AuraText variant="bodyBold" style={{ marginBottom: 8 }}>3. THIRD-PARTY DISCLOSURE</AuraText>
                        <AuraText variant="body" color={AuraColors.gray500}>
                            We do not sell or trade your data. Information is only shared with platform participants (Clients/Talent) as necessary to complete established contracts.
                        </AuraText>
                    </View>

                    <View style={styles.section}>
                        <AuraText variant="bodyBold" style={{ marginBottom: 8 }}>4. COORDINATE TRACKING</AuraText>
                        <AuraText variant="body" color={AuraColors.gray500}>
                            Real-time location data is only tracked during an active assignment for safety and verification purposes. This data is not archived beyond the mission duration.
                        </AuraText>
                    </View>

                    <View style={styles.footer}>
                        <AuraText variant="caption" color={AuraColors.gray600} align="center">
                            Last Revised: December 2025
                        </AuraText>
                        <AuraText variant="caption" color={AuraColors.gray600} align="center" style={{ marginTop: 4 }}>
                            AURA CORE v3.0 // SECURE NODE
                        </AuraText>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    content: {
        padding: 24,
        paddingBottom: 60,
    },
    section: {
        marginBottom: 32,
    },
    footer: {
        marginTop: 40,
        paddingTop: 40,
        borderTopWidth: 1,
        borderTopColor: AuraColors.gray100,
    }
});
