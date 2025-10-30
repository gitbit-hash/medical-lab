// app/api/tests/[id]/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client';
import { TestFormData, ApiResponse } from '../../../types';
import { Prisma } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const test = await localPrisma.test.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!test || test.is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('Failed to fetch test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch test'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse<ApiResponse<any>>> {
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

    // Build update data with proper JSON handling
    const updateData: any = {
      patient_id,
      referring_doctor_id: referring_doctor_id || null,
      test_type,
      test_code: test_code || null,
      status: status || 'Pending',
      units: units || null,
      tested_at: tested_at ? new Date(tested_at) : null,
      completed_at: completed_at ? new Date(completed_at) : null,
      sync_status: 'Pending',
    };

    // Handle JSON fields with proper Prisma null types
    if (results === null || results === undefined) {
      updateData.results = Prisma.DbNull;
    } else {
      updateData.results = results;
    }

    if (normal_range === null || normal_range === undefined) {
      updateData.normal_range = Prisma.DbNull;
    } else {
      updateData.normal_range = normal_range;
    }

    const test = await localPrisma.test.update({
      where: { id: params.id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('Failed to update test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update test'
      },
      { status: 500 }
    );
  }
}