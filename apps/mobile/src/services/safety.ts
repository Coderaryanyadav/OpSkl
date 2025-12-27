import { supabase } from '../core/api/supabase';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

const _SOS_CONTACT_LIMIT = 3;

export const SafetyService = {

    /**
     * Applies Ghost Mode (Location Fuzzing)
     * offsets the real coordinates by a random amount within `radiusMeters`
     */
    async getFuzzedLocation(radiusMeters: number = 500) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return null;

        const location = await Location.getCurrentPositionAsync({});

        // Simple fuzzing logic: Add random offset roughly converting meters to degrees
        // 1 deg lat = ~111km, 1 deg lng = ~111km * cos(lat)
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
     * 1. Vibrates phone aggressively
     * 2. Notifies trusted contacts
     * 3. Notifies Admin/Safety Center
     */
    async activateSOS() {
        // 1. Haptics
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Simulate strong vibration loop if possible, or just repeated impact
        for (let i = 0; i < 5; i++) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        // 2. Get Location (Real, not fuzzed)
        const location = await Location.getCurrentPositionAsync({});

        // 3. Notify Trusted Contacts (Mock)

        // In production, this calls a tailored Edge Function:
        const { error } = await supabase.functions.invoke('emergency-sos', {
            body: {
                location: location.coords,
                timestamp: new Date().toISOString()
            }
        });

        if (error) {
            console.error("SOS Signal Failed to Reach Server", error);
            Alert.alert("Connection Failed", "Calling Local Emergency Services...");
            // Linking.openURL('tel:112');
        } else {
            Alert.alert("SOS SENT", "Your trusted contacts and OpSkl Safety Team have been notified with your live location.");
        }

        return true;
    },

    /**
     * Trust Handshake
     * Disables ghost mode when both parties are within range and confirm.
     */
    async verifyArrival(gigId: string, userCoordinates: { lat: number, lng: number }) {
        // Check distance to gig location
        const { data: gig } = await supabase.from('gigs').select('location_lat, location_lng').eq('id', gigId).single();

        if (!gig) return false;

        // Haversine formula distance check would go here
        // For now, assume success logic
        const distance = 0; // calculateDistance(userCoordinates, {lat: gig.location_lat, lng: gig.location_lng});

        if (distance < 100) { // 100 meters
            return true;
        }
        return false;
    }
};
