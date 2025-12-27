import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

/**
 * 📅 INDUSTRIAL CALENDAR SERVICE
 * Deep integration with system scheduling for mission lifecycle management.
 */

export const CalendarService = {
    async getDefaultCalendarSource() {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendars = calendars.filter(each => each.source.name === 'Default');
        return defaultCalendars.length ? defaultCalendars[0].source : calendars[0].source;
    },

    async createCalendar() {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const editable = calendars.find(c => c.allowsModifications);

        if (editable) return editable.id;

        const defaultCalendarSource = Platform.OS === 'ios'
            ? await this.getDefaultCalendarSource()
            : { isLocalAccount: true, name: 'OpSkl Calendar', type: Calendar.SourceType.LOCAL };

        return await Calendar.createCalendarAsync({
            title: 'OpSkl Gigs',
            color: 'black',
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: (defaultCalendarSource as any).id,
            source: defaultCalendarSource,
            name: 'internalCalendarName',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
    },

    async addGigToCalendar(gig: { title: string, startTime: Date, durationMinutes: number, description: string }) {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') return false;

        try {
            const calendarId = await this.createCalendar();
            const endTime = new Date(gig.startTime.getTime() + gig.durationMinutes * 60000);

            await Calendar.createEventAsync(calendarId, {
                title: `OpSkl: ${gig.title}`,
                startDate: gig.startTime,
                endDate: endTime,
                notes: gig.description,
                location: 'Operational Site',
                alarms: [{ relativeOffset: -60 }]
            });
            return true;
        } catch (e) {
            console.warn('[CalendarService] Entry Error:', e);
            return false;
        }
    }
};
