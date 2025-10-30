// app/api/tests/route.ts
import { NextResponse } from 'next/server';
import { offlineQueue } from '../../lib/sync/offline-queue';

export async function GET() {
  try {
    const { localPrisma } = await import('../../lib/db/local-client');

    const tests = await localPrisma.test.findMany({
      where: { is_deleted: false },
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error('Failed to fetch tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patient_id,
      referring_doctor_id,
      test_type,
      test_code,
      status,
      results,
      normal_range,
      units,
      tested_at,
      completed_at,
    } = body;

    // Use offline queue to handle test creation
    const test = await offlineQueue.addTest({
      patient_id,
      referring_doctor_id,
      test_type,
      test_code,
      status: status || 'Pending',
      results: results,
      normal_range: normal_range,
      units,
      tested_at: tested_at ? new Date(tested_at) : null,
      completed_at: completed_at ? new Date(completed_at) : null,
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error('Failed to create test:', error);
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    );
  }
}