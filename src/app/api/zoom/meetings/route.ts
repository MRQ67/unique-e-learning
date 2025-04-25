import { NextResponse } from 'next/server';
import { createMeeting } from '@/lib/zoom';

export async function POST(request: Request) {
  try {
    const { topic, start_time, duration } = await request.json();
    const meeting = await createMeeting({ topic, start_time, duration });
    return NextResponse.json(meeting);
  } catch (error: any) {
    console.error('Zoom API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
