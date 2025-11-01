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

    // Get detailed counts for debugging
    const [pendingPatients, pendingDoctors, pendingTests, totalTests, deletedPendingTests] = await localPrisma.$transaction([
      localPrisma.patient.count({
        where: {
          sync_status: 'Pending',
          is_deleted: false
        }
      }),
      localPrisma.doctor.count({
        where: {
          sync_status: 'Pending',
          is_deleted: false
        }
      }),
      localPrisma.test.count({
        where: {
          sync_status: 'Pending',
          is_deleted: false
        }
      }),
      localPrisma.test.count(), // Total tests
      localPrisma.test.count({
        where: {
          sync_status: 'Pending',
          is_deleted: true
        }
      }),
    ]);

    const status = {
      pendingPatients,
      pendingDoctors,
      pendingTests,
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