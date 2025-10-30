// app/api/sync/route.ts
import { syncEngine } from '../../lib/sync/sync-engine';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await syncEngine.sync();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { localPrisma } = await import('../../lib/db/local-client');

    // Get pending counts from database
    const pendingCounts = await localPrisma.$transaction([
      localPrisma.patient.count({ where: { sync_status: 'Pending' } }),
      localPrisma.doctor.count({ where: { sync_status: 'Pending' } }),
      localPrisma.test.count({ where: { sync_status: 'Pending' } }),
    ]);

    const status = {
      pendingPatients: pendingCounts[0],
      pendingDoctors: pendingCounts[1],
      pendingTests: pendingCounts[2],
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}