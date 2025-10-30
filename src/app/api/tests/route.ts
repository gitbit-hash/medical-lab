// app/api/tests/route.ts
import { NextResponse } from 'next/server';
import { offlineQueue } from '../../lib/sync/offline-queue';
import { TestFormData, ApiResponse } from '../../types';
import { Prisma } from '@prisma/client';

export async function GET(): Promise<NextResponse<ApiResponse<any[]>>> {
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

    return NextResponse.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    console.error('Failed to fetch tests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tests'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body: TestFormData = await request.json();
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

    // Prepare test data with proper JSON handling
    const testData = {
      patient_id,
      referring_doctor_id: referring_doctor_id || null,
      test_type,
      test_code: test_code || null,
      status: status || 'Pending',
      units: units || null,
      tested_at: tested_at ? new Date(tested_at) : null,
      completed_at: completed_at ? new Date(completed_at) : null,
    };

    // Handle JSON fields with proper Prisma null types
    if (results === null || results === undefined) {
      (testData as any).results = Prisma.DbNull;
    } else {
      (testData as any).results = results;
    }

    if (normal_range === null || normal_range === undefined) {
      (testData as any).normal_range = Prisma.DbNull;
    } else {
      (testData as any).normal_range = normal_range;
    }

    // Use offline queue to handle test creation
    const test = await offlineQueue.addTest(testData);

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('Failed to create test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test'
      },
      { status: 500 }
    );
  }
}