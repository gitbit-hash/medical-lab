// app/api/doctors/[id]/route.ts
import { localPrisma } from '../../../lib/db/local-client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const doctor = await localPrisma.doctor.findUnique({
      where: { id },
      include: {
        patients: {
          include: {
            patient: {
              include: {
                tests: {
                  where: { is_deleted: false }, // ← ADD THIS
                  orderBy: { created_at: 'desc' }
                }
              }
            },
          },
        },
      },
    });

    if (!doctor || doctor.is_deleted) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Failed to fetch doctor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { name, specialization, phone, email, clinic_address } = body;

    const { id } = await params
    const doctor = await localPrisma.doctor.update({
      where: { id },

      data: {
        name,
        specialization,
        phone,
        email,
        clinic_address,
        sync_status: 'Pending', // Mark for sync
      },
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Failed to update doctor:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor' },
      { status: 500 }
    );
  }
}