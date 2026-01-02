// @ts-ignore
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

/**
 * 📅 INDUSTRIAL CALENDAR SERVICE
 * Deep integration with system scheduling for mission lifecycle management.
 */

export const CalendarService = {
    async getDefaultCalendarSource() {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find((c: any) => c.source.name === 'Default');
        return defaultCalendar ? defaultCalendar.source : (calendars.length ? calendars[0].source : null);
    },

    async createCalendar() {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const editable = calendars.find((c: any) => c.allowsModifications);

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
        } catch (error) {
            if (__DEV__) console.error(error);
            console.error('Calendar event add error:', error);
            return false;
        }
    }
};
