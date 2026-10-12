import { google } from "googleapis";
import type { CalendarEvent } from "@/types/database";

export type GoogleCalendarSyncStatus = "synced" | "skipped" | "error";

export type GoogleCalendarSyncResult = {
  status: GoogleCalendarSyncStatus;
  calendarId?: string;
  eventId?: string;
  error?: string;
};

function getGoogleCalendarEnv() {
  const configured = process.env.GOOGLE_CALENDAR_ENABLED !== "false";
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const credentialsJson = process.env.GOOGLE_CALENDAR_CREDENTIALS_JSON;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  return {
    configured,
    calendarId,
    credentialsJson,
    clientEmail,
    privateKey,
  };
}

export function isGoogleCalendarConfigured() {
  const { configured, credentialsJson, clientEmail, privateKey } = getGoogleCalendarEnv();

  if (!configured) {
    return false;
  }

  if (credentialsJson) {
    try {
      const parsed = JSON.parse(credentialsJson);
      return Boolean(parsed.client_email && parsed.private_key);
    } catch {
      return false;
    }
  }

  return Boolean(clientEmail && privateKey);
}

function parseServiceAccountCredentials() {
  const { credentialsJson, clientEmail, privateKey } = getGoogleCalendarEnv();

  if (credentialsJson) {
    try {
      const parsed = JSON.parse(credentialsJson);
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key?.replace(/\\n/g, "\n"),
      };
    } catch {
      return null;
    }
  }

  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

async function getCalendarClient() {
  if (!isGoogleCalendarConfigured()) {
    return null;
  }

  const credentials = parseServiceAccountCredentials();
  if (!credentials) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

function buildGoogleEventPayload(event: {
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
  status: CalendarEvent["status"];
  event_type: CalendarEvent["event_type"];
  class_names?: string[];
}) {
  const descriptionParts = [event.description, event.class_names?.length ? `כיתות: ${event.class_names.join(", ")}` : "", `סוג: ${event.event_type}`].filter(Boolean);

  const base = {
    summary: event.title,
    description: descriptionParts.join("\n") || undefined,
    location: event.location || undefined,
    status: event.status === "draft" ? "tentative" : "confirmed",
  } as const;

  if (event.all_day) {
    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    return {
      ...base,
      start: { date: startDate.toISOString().slice(0, 10) },
      end: { date: endDate.toISOString().slice(0, 10) },
    };
  }

  return {
    ...base,
    start: { dateTime: new Date(event.start_at).toISOString() },
    end: { dateTime: event.end_at ? new Date(event.end_at).toISOString() : new Date(new Date(event.start_at).getTime() + 60 * 60 * 1000).toISOString() },
  };
}

export async function syncCalendarEventToGoogle(event: {
  id?: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
  status: CalendarEvent["status"];
  event_type: CalendarEvent["event_type"];
  external_event_id?: string | null;
  external_calendar_id?: string | null;
  class_names?: string[];
}): Promise<GoogleCalendarSyncResult> {
  const settings = getGoogleCalendarEnv();
  if (!settings.configured) {
    return { status: "skipped", calendarId: settings.calendarId };
  }

  const calendar = await getCalendarClient();
  if (!calendar) {
    return { status: "skipped", calendarId: settings.calendarId, error: "Google Calendar credentials not configured" };
  }

  try {
    const requestBody = buildGoogleEventPayload(event);

    const response = event.external_event_id
      ? await calendar.events.update({
          calendarId: event.external_calendar_id || settings.calendarId,
          eventId: event.external_event_id,
          requestBody,
        })
      : await calendar.events.insert({
          calendarId: settings.calendarId,
          requestBody,
        });

    if (!response.data.id) {
      throw new Error("Google Calendar did not return an event ID.");
    }

    return {
      status: "synced",
      calendarId: response.data.htmlLink ? settings.calendarId : settings.calendarId,
      eventId: response.data.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Google Calendar error";
    return {
      status: "error",
      calendarId: settings.calendarId,
      error: message,
    };
  }
}
