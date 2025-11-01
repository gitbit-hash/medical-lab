// app/api/patients/[id]/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client';
import { PatientFormData, ApiResponse } from '../../../types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const patient = await localPrisma.patient.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
        tests: {
          include: {
            doctor: true,
          },
        },
      },
    });

    if (!patient || patient.is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Failed to fetch patient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patient'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body: PatientFormData = await request.json();
    const { name, date_of_birth, phone, email, address, doctorIds } = body;

    const { id } = await params;

    // Update patient
    const patient = await localPrisma.patient.update({
      where: { id },
      data: {
        name,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        phone,
        email,
        address,
        sync_status: 'Pending',
      },
    });

    // Update doctor relationships
    if (doctorIds) {
      // Remove existing relationships
      await localPrisma.patientDoctor.deleteMany({
        where: { patient_id: id },
      });

      // Create new relationships
      if (doctorIds.length > 0) {
        await localPrisma.patientDoctor.createMany({
          data: doctorIds.map(doctorId => ({
            patient_id: id,
            doctor_id: doctorId,
            sync_status: 'Pending',
          })),
        });
      }
    }

    // Return updated patient with relations
    const patientWithDoctors = await localPrisma.patient.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: patientWithDoctors,
    });
  } catch (error) {
    console.error('Failed to update patient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update patient'
      },
      { status: 500 }
    );
  }
}