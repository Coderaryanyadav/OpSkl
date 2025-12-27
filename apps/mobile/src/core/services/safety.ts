import { supabase } from '../api/supabase';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

/**
 * 🛡️ INDUSTRIAL SAFETY SERVICE (SHIELD)
 * Privacy-first protection and emergency response system.
 */

export const SafetyService = {

    /**
     * Applies Ghost Mode (Location Fuzzing)
     * Offsets the coordinates to protect user privacy in general feeds.
     */
    async getFuzzedLocation(radiusMeters: number = 500) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return null;

        const location = await Location.getCurrentPositionAsync({});

        // Convert meters to approximate degree offsets
        const offsetLat = (Math.random() - 0.5) * 2 * (radiusMeters / 111000);
        const offsetLng = (Math.random() - 0.5) * 2 * (radiusMeters / (111000 * Math.cos(location.coords.latitude * Math.PI / 180)));

        return {
            latitude: location.coords.latitude + offsetLat,
            longitude: location.coords.longitude + offsetLng,
            realLatitude: location.coords.latitude,
            realLongitude: location.coords.longitude,
        };
    },

    /**
     * Activates SOS Shield
     * Critical Response flow: Aggressive haptics -> Real Location -> Remote Ping.
     */
    async activateSOS() {
        // Aggressive Haptics Loop
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        for (let i = 0; i < 3; i++) {
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), i * 200);
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
        });

        const { error } = await supabase.functions.invoke('emergency-sos', {
            body: {
                location: location.coords,
                timestamp: new Date().toISOString()
            }
        });

        if (error) {
            console.error("[Shield] SOS signal interference:", error);
            return false;
        }

        return true;
    },

    /**
     * Verify distance between parties for trust handshake.
     */
    async verifyArrival(gigLocation: { lat: number, lng: number }, userLocation: { lat: number, lng: number }) {
        // Simplified Haversine logic
        const dist = Math.sqrt(
            Math.pow(gigLocation.lat - userLocation.lat, 2) + 
            Math.pow(gigLocation.lng - userLocation.lng, 2)
        );
        // ~0.001 deg is roughly 100-110m
        return dist < 0.001;
    }
};
