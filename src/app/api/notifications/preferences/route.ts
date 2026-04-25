import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from '@/lib/error-handler';
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from '@/lib/notifications/preferences-store';

export async function GET(request: NextRequest) {
  const userAddress = request.nextUrl.searchParams.get('userAddress');
  if (!userAddress) {
    return ErrorHandler.validation('userAddress is required');
  }

  try {
    const preferences = await getNotificationPreferences(userAddress);
    if (!preferences) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({ data: preferences }, { status: 200 });
  } catch (error) {
    return ErrorHandler.serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return ErrorHandler.validation('Invalid JSON body');
  }

  const userAddress = body.userAddress;
  if (!userAddress || typeof userAddress !== 'string') {
    return ErrorHandler.validation('userAddress is required');
  }

  try {
    const preferences = await upsertNotificationPreferences({
      userAddress,
      email: typeof body.email === 'string' ? body.email : undefined,
      phoneNumber: typeof body.phoneNumber === 'string' ? body.phoneNumber : undefined,
      emailEnabled: body.emailEnabled !== false,
      smsEnabled: body.smsEnabled === true,
      notifyOnPending: body.notifyOnPending !== false,
      notifyOnCompleted: body.notifyOnCompleted !== false,
      notifyOnFailed: body.notifyOnFailed !== false,
    });

    return NextResponse.json({ data: preferences }, { status: 200 });
  } catch (error) {
    return ErrorHandler.serverError(error);
  }
}
