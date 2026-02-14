import { google } from "googleapis";

/**
 * Get an authenticated Google Calendar client using service account or OAuth refresh token.
 */
function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.calendar({ version: "v3", auth });
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
}

/**
 * Check if a specific date has available slots on the business calendar.
 * Returns events on that date so the user can see what's booked.
 */
export async function getEventsForDate(
  calendarId: string,
  date: string
): Promise<{ available: boolean; events: CalendarEvent[] }> {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    console.log("[DEV MODE] getEventsForDate: Google Calendar not configured");
    return { available: true, events: [] };
  }

  const calendar = getCalendarClient();

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const res = await calendar.events.list({
    calendarId,
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events: CalendarEvent[] = (res.data.items ?? []).map((e) => ({
    id: e.id ?? "",
    summary: e.summary ?? "",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
  }));

  return { available: events.length === 0, events };
}

/**
 * Get events for an entire month.
 */
export async function getEventsForMonth(
  calendarId: string,
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    console.log("[DEV MODE] getEventsForMonth: Google Calendar not configured");
    return [];
  }

  const calendar = getCalendarClient();

  const timeMin = new Date(year, month, 1);
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const res = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items ?? []).map((e) => ({
    id: e.id ?? "",
    summary: e.summary ?? "",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
  }));
}

/**
 * Create an event on the business calendar (e.g., when visit is scheduled).
 */
export async function createEvent(
  calendarId: string,
  params: {
    summary: string;
    description?: string;
    date: string;
    startHour?: number;
    durationHours?: number;
  }
): Promise<string | null> {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    console.log("[DEV MODE] createEvent:", params.summary);
    return null;
  }

  const calendar = getCalendarClient();
  const startHour = params.startHour ?? 10;
  const duration = params.durationHours ?? 2;

  const start = new Date(params.date);
  start.setHours(startHour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(startHour + duration);

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: start.toISOString(), timeZone: "Asia/Seoul" },
      end: { dateTime: end.toISOString(), timeZone: "Asia/Seoul" },
    },
  });

  return res.data.id ?? null;
}
