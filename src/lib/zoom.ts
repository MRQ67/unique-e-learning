// Helper to obtain and cache a Zoom Server-to-Server OAuth token and create meetings
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getZoomToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const url = 'https://zoom.us/oauth/token';
  const body = new URLSearchParams({
    grant_type: 'account_credentials',
    account_id: accountId,
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Zoom token fetch error:', err);
    throw new Error('Failed to fetch Zoom token');
  }
  const data = await res.json();
  const token = data.access_token;
  const expiresIn = data.expires_in; // seconds
  cachedToken = { token, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
  return token;
}

export interface MeetingOptions {
  topic: string;
  start_time: string;
  duration: number;
}

export async function createMeeting(options: MeetingOptions): Promise<{ meetingId: string; joinUrl: string }> {
  const token = await getZoomToken();
  // Create meeting under account-level token using 'me'
  const meetRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: options.topic,
      type: 2,
      start_time: options.start_time,
      duration: options.duration,
    }),
  });
  if (!meetRes.ok) {
    const errText = await meetRes.text();
    console.error('Zoom create meeting error:', errText);
    throw new Error(`Zoom create meeting failed: ${errText}`);
  }
  const data = await meetRes.json();
  return { meetingId: data.id.toString(), joinUrl: data.join_url };
}
