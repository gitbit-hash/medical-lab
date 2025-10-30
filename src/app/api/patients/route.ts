// app/api/patients/route.ts
import { localPrisma } from '../../lib/db/local-client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
    })
    return NextResponse.json(patients)
  } catch (error) {
    console.error('Failed to fetch patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, date_of_birth, phone, email, address, doctorIds } = body

    const patient = await localPrisma.patient.create({
      data: {
        name,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        phone,
        email,
        address,
        doctors: {
          create: doctorIds?.map((doctorId: string) => ({
            doctor: { connect: { id: doctorId } },
          })),
        },
      },
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
      },
    })

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Failed to create patient:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}