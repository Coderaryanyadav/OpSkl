import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraColors, AuraBorderRadius } from '../theme/aura';
import { AuraText } from './AuraText';
import { MapPin, Navigation, Shield, Target } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useAura } from '../context/AuraProvider';

type LocationPickerProps = {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
};

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
    const haptics = useAuraHaptics();
    const { showToast } = useAura();
    const [selectedLocation, setSelectedLocation] = React.useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = React.useState<string>('');
    const [loading, setLoading] = React.useState(false);

    async function getCurrentLocation() {
        setLoading(true);
        haptics.medium();
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                showToast({ message: 'Location access denied. Enable in system settings.', type: 'error' });
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords = {
                lat: location.coords.latitude,
                lng: location.coords.longitude
            };

            setSelectedLocation(coords);
            onLocationSelect(coords);

            const addresses = await Location.reverseGeocodeAsync({
                latitude: coords.lat,
                longitude: coords.lng
            });

            if (addresses[0]) {
                const addr = addresses[0];
                setAddress([addr.city, addr.region, addr.country].filter(Boolean).join(', '));
            }
            showToast({ message: 'Coordinates Locked', type: 'success' });
        } catch (error) {
            if (__DEV__) console.error(error);
            showToast({ message: 'GPS failed. Please enable location services.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    function openMaps() {
        if (selectedLocation) {
            // 🗺️ USING OPENSTREETMAP (100% FREE & OPEN)
            const url = `https://www.openstreetmap.org/?mlat=${selectedLocation.lat}&mlon=${selectedLocation.lng}#map=15/${selectedLocation.lat}/${selectedLocation.lng}`;
            Linking.openURL(url);
        }
    }

    return (
        <View style={styles.container}>
            {selectedLocation ? (
                <View style={styles.selectedCard}>
                    <View style={styles.indicatorBox}>
                        <Target color={AuraColors.primary} size={20} />
                    </View>
                    <View style={styles.locationInfo}>
                        <AuraText variant="bodyBold" numberOfLines={1}>{address || 'Operational Zone'}</AuraText>
                        <AuraText variant="caption" color={AuraColors.gray500}>
                            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </AuraText>
                    </View>
                    <TouchableOpacity onPress={openMaps} style={styles.mapBtn}>
                        <Navigation color={AuraColors.white} size={18} />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.pickButton}
                    onPress={getCurrentLocation}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={AuraColors.primary} />
                    ) : (
                        <>
                            <MapPin color={AuraColors.primary} size={20} />
                            <AuraText variant="bodyBold" color={AuraColors.primary}>SYNC CURRENT LOCATION</AuraText>
                        </>
                    )}
                </TouchableOpacity>
            )}

            <View style={styles.privacyNote}>
                <Shield color={AuraColors.gray600} size={12} />
                <AuraText variant="caption" color={AuraColors.gray600}>
                    Exact coordinates obfuscated until talent deployment is authorized.
                </AuraText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    pickButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
        padding: 16,
        borderRadius: AuraBorderRadius.l,
        gap: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 122, 255, 0.15)',
        height: 60,
    },
    selectedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AuraColors.surfaceElevated,
        padding: 16,
        borderRadius: AuraBorderRadius.l,
        gap: 16,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    indicatorBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationInfo: {
        flex: 1,
    },
    mapBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: AuraColors.gray800,
        alignItems: 'center',
        justifyContent: 'center',
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 4,
    }
});
