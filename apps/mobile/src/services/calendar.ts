import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

export const CalendarService = {
    async getDefaultCalendarSource() {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendars = calendars.filter(each => each.source.name === 'Default');
        return defaultCalendars.length ? defaultCalendars[0].source : calendars[0].source;
    },

    async createCalendar() {
        // iOS requires a default calendar to be created or selected on first run potentially, 
        // but typically we add events to existing calendars.
        // For simplicity, we find the first editable calendar.
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const editable = calendars.find(c => c.allowsModifications);

        if (editable) return editable.id;

        // If none, create one (Android mainly)
        const defaultCalendarSource = Platform.OS === 'ios'
            ? await this.getDefaultCalendarSource()
            : { isLocalAccount: true, name: 'OpSkl Calendar', type: Calendar.SourceType.LOCAL };

        const newCalendarID = await Calendar.createCalendarAsync({
            title: 'OpSkl Gigs',
            color: 'black',
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: (defaultCalendarSource as any).id,
            source: defaultCalendarSource,
            name: 'internalCalendarName',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });

        return newCalendarID;
    },

    async addGigToCalendar(gig: { title: string, startTime: Date, durationMinutes: number, description: string }) {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Needs calendar access to sync gigs.');
            return;
        }

        const calendarId = await this.createCalendar();

        const endTime = new Date(gig.startTime.getTime() + gig.durationMinutes * 60000);

        try {
            await Calendar.createEventAsync(calendarId, {
                title: `OpSkl: ${gig.title}`,
                startDate: gig.startTime,
                endDate: endTime,
                notes: gig.description,
                location: 'Gig Location',
                alarms: [{ relativeOffset: -60 }] // Alert 1 hour before
            });
            return true;
        } catch (e) {
            console.warn(e);
            return false;
        }
    }
};
