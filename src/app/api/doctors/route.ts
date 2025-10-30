// app/api/doctors/route.ts
import { NextResponse } from 'next/server';
import { offlineQueue } from '../../lib/sync/offline-queue';

export async function GET() {
  try {
    const { localPrisma } = await import('../../lib/db/local-client');

    const doctors = await localPrisma.doctor.findMany({
      where: { is_deleted: false },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, specialization, phone, email, clinic_address } = body;

    // Use offline queue to handle doctor creation
    const doctor = await offlineQueue.addDoctor({
      name,
      specialization,
      phone,
      email,
      clinic_address,
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Failed to create doctor:', error);
    return NextResponse.json(
      { error: 'Failed to create doctor' },
      { status: 500 }
    );
  }
}