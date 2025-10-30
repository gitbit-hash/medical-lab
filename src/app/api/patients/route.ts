// app/api/patients/route.ts
import { NextResponse } from 'next/server';
import { offlineQueue } from '../../lib/sync/offline-queue';
import { PatientFormData, ApiResponse } from '../../types';

export async function GET(): Promise<NextResponse<ApiResponse<any[]>>> {
  try {
    const { localPrisma } = await import('../../lib/db/local-client');

    const patients = await localPrisma.patient.findMany({
      where: { is_deleted: false },
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patients'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body: PatientFormData = await request.json();
    const { name, date_of_birth, phone, email, address, doctorIds } = body;

    // Use offline queue to handle patient creation
    const patient = await offlineQueue.addPatient({
      name,
      date_of_birth,
      phone,
      email,
      address,
    });

    // Handle doctor relationships
    if (doctorIds && doctorIds.length > 0) {
      const { localPrisma } = await import('../../lib/db/local-client');

      for (const doctorId of doctorIds) {
        await localPrisma.patientDoctor.create({
          data: {
            patient_id: patient.id,
            doctor_id: doctorId,
            sync_status: 'Pending',
          },
        });
      }
    }

    // Return the created patient with relations
    const { localPrisma } = await import('../../lib/db/local-client');
    const patientWithDoctors = await localPrisma.patient.findUnique({
      where: { id: patient.id },
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
    console.error('Failed to create patient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create patient'
      },
      { status: 500 }
    );
  }
}