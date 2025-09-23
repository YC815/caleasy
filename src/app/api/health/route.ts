import { NextResponse } from 'next/server';

export async function GET() {
  const required = ['DATABASE_URL', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  const presence = Object.fromEntries(required.map(k => [k, !!process.env[k]]));

  return NextResponse.json({
    ok: true,
    node: process.version,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    envPresence: presence,
  });
}