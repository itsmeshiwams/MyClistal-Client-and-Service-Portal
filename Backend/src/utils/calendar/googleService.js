// src/utils/googleService.js
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const makeOauthClient = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

// Generate URL for user consent
export const getGoogleAuthURL = () => {
  const oauth2Client = makeOauthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
};

// Exchange code for tokens (do NOT store tokens in-memory here; return to caller)
export const getGoogleTokens = async (code) => {
  const oauth2Client = makeOauthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Add or update an event on a user's Google Calendar using that user's tokens
export const addEventToGoogleCalendar = async (tokens, event) => {
  const oauth2Client = makeOauthClient();
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const newEvent = {
    summary: event.title,
    description: event.description,
    start: { dateTime: new Date(event.start).toISOString() },
    end: { dateTime: new Date(event.end).toISOString() },
  };

  const result = await calendar.events.insert({
    calendarId: "primary",
    resource: newEvent,
  });

  return result.data;
};

export const refreshAccessToken = async (refreshToken) => {
  const res = await axios.post("https://oauth2.googleapis.com/token", {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  return res.data;
};

export default {
  getGoogleAuthURL,
  getGoogleTokens,
  addEventToGoogleCalendar,
  refreshAccessToken,
};
