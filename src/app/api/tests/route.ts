// app/api/tests/route.ts
import { NextResponse } from 'next/server';
import { offlineQueue } from '../../lib/sync/offline-queue';
import { TestFormData, ApiResponse } from '../../types';
import { Prisma } from '@prisma/client';
import { localPrisma } from '@/app/lib/db/local-client';

// Add this to your existing app/api/tests/route.ts in the GET function
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let where: any = { is_deleted: false };

    if (patientId) {
      where.patient_id = patientId;
    }

    const tests = await localPrisma.test.findMany({
      where,
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
      test_type,
      test_code,
      test_template_id,
      status = 'Pending',
    } = body;

    // Check for existing identical tests to prevent duplicates
    const existingTest = await localPrisma.test.findFirst({
      where: {
        patient_id,
        test_template_id: test_template_id || undefined,
        test_type,
        is_deleted: false,
      },
    });

    if (existingTest) {
      console.log('⚠️ Duplicate test found, returning existing:', existingTest.id);
      return NextResponse.json({
        success: true,
        data: existingTest,
      });
    }

    console.log('🆕 Creating new test:', {
      patient_id,
      test_type,
      test_template_id
    });

    // Use offline queue to handle test creation
    const test = await offlineQueue.addTest({
      patient_id,
      referring_doctor_id: body.referring_doctor_id || null,
      test_type,
      test_code: test_code || null,
      test_template_id: test_template_id || null,
      status,
      results: body.results || null,
      normal_range: body.normal_range || null,
      units: body.units || null,
      tested_at: body.tested_at ? new Date(body.tested_at) : null,
      completed_at: body.completed_at ? new Date(body.completed_at) : null,
    });

    console.log('✅ Test created:', test.id);

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('❌ Failed to create test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test'
      },
      { status: 500 }
    );
  }
}

