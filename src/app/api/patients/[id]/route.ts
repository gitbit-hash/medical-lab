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
          where: { is_deleted: false },
          include: {
            doctor: true,
          },
          orderBy: { created_at: 'desc' },
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;

    // First, check if patient exists and is not already deleted
    const existingPatient = await localPrisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient not found'
        },
        { status: 404 }
      );
    }

    if (existingPatient.is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient already deleted'
        },
        { status: 400 }
      );
    }

    // Use offline queue to handle patient deletion (soft delete)
    const { offlineQueue } = await import('../../../lib/sync/offline-queue');

    // Soft delete the patient through the offline queue
    const deletedPatient = await offlineQueue.addPatient({
      id,
      name: existingPatient.name,
      date_of_birth: existingPatient.date_of_birth?.toISOString(),
      phone: existingPatient.phone,
      email: existingPatient.email,
      address: existingPatient.address,
      sync_status: 'Pending', // Mark for sync
      is_deleted: true, // This will be handled by the queue
    });

    return NextResponse.json({
      success: true,
      data: deletedPatient,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete patient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete patient'
      },
      { status: 500 }
    );
  }
}